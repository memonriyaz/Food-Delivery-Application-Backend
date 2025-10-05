import { Body, Controller, Headers, HttpCode, InternalServerErrorException, Post, Req } from '@nestjs/common';
import { CreatePaymentOrderParams, PaymentOrderResult, PaymentsService } from './payments.service';
import type { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}


    @Post('create-order')
  async createPaymentOrder(
    @Body() body: any,
  ): Promise<PaymentOrderResult> {
    try {
      const paymentOrder = await this.paymentsService.createCashfreeOrder(body);
      console.log("Payment" , paymentOrder)
      return {
        orderId: paymentOrder.orderId,
        paymentSessionId: paymentOrder.paymentSessionId,
        raw: paymentOrder.raw,
        redirectUrl: `https://sandbox.cashfree.com/checkout/post/redirect?session_id=${paymentOrder.paymentSessionId}`,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to create payment order: ${error?.message || error}`,
      );
    }
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    const rawBody = (req.body as Buffer).toString('utf8');
    await this.paymentsService.handleCashfreeWebhook(rawBody, signature);
    return { received: true };
  }
}
