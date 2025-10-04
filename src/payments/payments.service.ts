/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHmac } from 'crypto';
import { Order } from '../schemas/order.schema';

export interface CreatePaymentOrderParams {
  orderAmount: number;
  orderCurrency?: string; // default: INR
  customerId: string;
  customerPhone: string;
}

export interface PaymentOrderResult {
  orderId?: string;
  paymentSessionId?: string;
  raw?: Record<string, unknown>;
}

@Injectable()
export class PaymentsService {
  private baseUrl = process.env.CF_BASE_URL || 'https://sandbox.cashfree.com';
  private apiVersion = process.env.CF_API_VERSION || '2023-08-01';
  private clientId = process.env.CF_CLIENT_ID;
  private clientSecret = process.env.CF_CLIENT_SECRET;
  private webhookSecret = process.env.CF_WEBHOOK_SECRET;

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
  ) {}

  async createCashfreeOrder(
    params: CreatePaymentOrderParams,
  ): Promise<PaymentOrderResult> {
    try {
      if (!this.clientId || !this.clientSecret) {
        throw new InternalServerErrorException(
          'Cashfree credentials are not configured (CF_CLIENT_ID/CF_CLIENT_SECRET)',
        );
      }

      const url = `${this.baseUrl}/pg/orders`;

      const body = {
        order_currency: params.orderCurrency || 'INR',
        order_amount: params.orderAmount,
        customer_details: {
          customer_id: params.customerId,
          customer_phone: params.customerPhone,
        },
      } as const;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': this.apiVersion,
          'x-client-id': this.clientId,
          'x-client-secret': this.clientSecret,
        },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        // surface the gateway error message if present
        throw new InternalServerErrorException(
          `Cashfree order creation failed: ${JSON.stringify(data)}`,
        );
      }

      // Map common fields if present
      const orderId = (data as any).order_id as string | undefined;
      const paymentSessionId = (data as any).payment_session_id as
        | string
        | undefined;

      return {
        orderId,
        paymentSessionId,
        raw: data,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to create Cashfree order: ${error?.message || error}`,
      );
    }
  }

  async createCashfreeOrderForExistingOrder(
    orderId: string,
    customerId: string,
    customerPhone: string,
  ): Promise<PaymentOrderResult> {
    // Load order
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new InternalServerErrorException('Order not found');
    }

    // Create Cashfree order using the order total
    const result = await this.createCashfreeOrder({
      orderAmount: order.totalAmount,
      orderCurrency: 'INR',
      customerId,
      customerPhone,
    });

    // Persist gateway order id on our order
    if (result.orderId) {
      order.paymentIntentId = result.orderId;
      order.paymentStatus = 'pending';
      await order.save();
    }

    return result;
  }

  verifyCashfreeSignature(rawBody: string, signature: string | undefined): boolean {
    if (!this.webhookSecret) {
      throw new InternalServerErrorException('CF_WEBHOOK_SECRET is not configured');
    }
    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }
    const computed = createHmac('sha256', this.webhookSecret)
      .update(rawBody, 'utf8')
      .digest('base64');
    return computed === signature;
  }

  async handleCashfreeWebhook(rawBody: string, signature: string | undefined) {
    const ok = this.verifyCashfreeSignature(rawBody, signature);
    if (!ok) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody) as any;
    const cfOrderId: string | undefined = payload.order_id || payload.data?.order?.order_id;
    const paymentStatus: string | undefined = payload.payment_status || payload.data?.payment?.payment_status || payload.order_status;

    if (!cfOrderId) {
      throw new InternalServerErrorException('Webhook payload missing order_id');
    }

    // Map gateway statuses to our enum
    let mapped: string = 'pending';
    const s = (paymentStatus || '').toUpperCase();
    if (s.includes('SUCCESS') || s === 'PAID' || s === 'COMPLETED') mapped = 'completed';
    else if (s.includes('FAIL') || s === 'FAILED') mapped = 'failed';
    else if (s.includes('REFUND') || s === 'REFUNDED') mapped = 'refunded';

    // Update order by paymentIntentId
    await this.orderModel
      .findOneAndUpdate({ paymentIntentId: cfOrderId }, { paymentStatus: mapped })
      .exec();

    return { ok: true } as const;
  }

  private mapGatewayStatusToInternal(status: string | undefined): string {
    if (!status) return 'pending';
    const s = status.toUpperCase();
    if (s.includes('SUCCESS') || s === 'PAID' || s === 'COMPLETED') return 'completed';
    if (s.includes('FAIL') || s === 'FAILED') return 'failed';
    if (s.includes('REFUND') || s === 'REFUNDED') return 'refunded';
    return 'pending';
  }

  async fetchCashfreeOrder(cfOrderId: string) {
    const url = `${this.baseUrl}/pg/orders/${cfOrderId}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-version': this.apiVersion,
        'x-client-id': this.clientId!,
        'x-client-secret': this.clientSecret!,
      },
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      throw new InternalServerErrorException(
        `Cashfree fetch order failed: ${JSON.stringify(data)}`,
      );
    }
    return data as any;
  }

  async confirmPaymentForOrder(orderId: string) {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new InternalServerErrorException('Order not found');
    if (!order.paymentIntentId) throw new InternalServerErrorException('Order has no paymentIntentId');
    const data = await this.fetchCashfreeOrder(order.paymentIntentId);
    const gatewayStatus = data?.order_status || data?.payments?.[0]?.payment_status;
    const mapped = this.mapGatewayStatusToInternal(gatewayStatus);
    order.paymentStatus = mapped;
    await order.save();
    return order;
  }

  async refundPayment(orderId: string) {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new InternalServerErrorException('Order not found');
    if (!order.paymentIntentId) throw new InternalServerErrorException('Order has no paymentIntentId');

    const url = `${this.baseUrl}/pg/orders/${order.paymentIntentId}/refunds`;
    const body = {
      refund_amount: order.totalAmount,
      refund_id: `refund_${order._id}`,
    } as const;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': this.apiVersion,
        'x-client-id': this.clientId!,
        'x-client-secret': this.clientSecret!,
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      throw new InternalServerErrorException(
        `Cashfree refund failed: ${JSON.stringify(data)}`,
      );
    }

    order.paymentStatus = 'refunded';
    await order.save();
    return order;
  }

  async getPaymentStatus(orderId: string): Promise<string> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new InternalServerErrorException('Order not found');
    return order.paymentStatus || 'pending';
  }
}
