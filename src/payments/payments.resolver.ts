import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentOrderOutput } from './dto/payment-order.output';
import { CreatePaymentOrderInput } from './dto/create-payment-order.input';
import { CreatePaymentForOrderInput } from './dto/create-payment-for-order.input';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrderOutput } from '../orders/dto/order.output';

@Resolver(() => PaymentOrderOutput)
export class PaymentsResolver {
  constructor(private readonly paymentsService: PaymentsService) {}

  // @Mutation(() => PaymentOrderOutput, { name: 'createPaymentOrder' })
  // async createPaymentOrder(
  //   @Args('input') input: CreatePaymentOrderInput,
  // ): Promise<PaymentOrderOutput> {
  //   const result = await this.paymentsService.createCashfreeOrder({
  //     orderAmount: input.orderAmount,
  //     orderCurrency: input.orderCurrency ?? 'INR',
  //     customerId: input.customerId,
  //     customerPhone: input.customerPhone,
  //   });

  //   return {
  //     orderId: result.orderId ?? null,
  //     paymentSessionId: result.paymentSessionId ?? null,
  //   };
  // }

  // // Create payment for an existing order and persist gateway order id
  // @UseGuards(GqlAuthGuard)
  // @Mutation(() => PaymentOrderOutput, { name: 'createPaymentForOrder' })
  // async createPaymentForOrder(
  //   @Args('input') input: CreatePaymentForOrderInput,
  //   @CurrentUser() user: any,
  // ): Promise<PaymentOrderOutput> {
  //   const result = await this.paymentsService.createCashfreeOrderForExistingOrder(
  //     input.orderId,
  //     user.id,
  //     input.customerPhone,
  //   );

  //   return {
  //     orderId: result.orderId ?? null,
  //     paymentSessionId: result.paymentSessionId ?? null,
  //   };
  // }

  // Confirm payment by fetching status from Cashfree and updating the order
  @UseGuards(GqlAuthGuard)
  @Mutation(() => OrderOutput, { name: 'confirmPayment' })
  async confirmPayment(
    @Args('orderId', { type: () => String }) orderId: string,
  ) {
    const o: any = await this.paymentsService.confirmPaymentForOrder(orderId);
    return {
      orderId: o._id.toString(),
      userId: o.userId.toString(),
      items: (o.items || []).map((i: any) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        subTotal: i.price * i.quantity,
      })),
      totalAmount: o.totalAmount,
      deliveryAddress: o.deliveryAddress,
      status: o.status,
      createdAt: o.createdAt,
    };
  }

  // Refund payment via Cashfree and update order.paymentStatus to refunded
  @UseGuards(GqlAuthGuard)
  @Mutation(() => OrderOutput, { name: 'refundPayment' })
  async refundPayment(
    @Args('orderId', { type: () => String }) orderId: string,
  ) {
    const o: any = await this.paymentsService.refundPayment(orderId);
    return {
      orderId: o._id.toString(),
      userId: o.userId.toString(),
      items: (o.items || []).map((i: any) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        subTotal: i.price * i.quantity,
      })),
      totalAmount: o.totalAmount,
      deliveryAddress: o.deliveryAddress,
      status: o.status,
      createdAt: o.createdAt,
    };
  }

  // Query the current payment status for an order
  @UseGuards(GqlAuthGuard)
  @Query(() => String, { name: 'paymentStatus' })
  async paymentStatus(
    @Args('orderId', { type: () => String }) orderId: string,
  ) {
    return this.paymentsService.getPaymentStatus(orderId);
  }
}
