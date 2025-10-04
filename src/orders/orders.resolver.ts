/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderInput } from './dto/create-order.input';
import { OrderOutput } from './dto/order.output';
import { OrderStatisticsOutput } from './dto/order-statistics.output';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Resolver(() => OrderOutput)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  private toOrderOutput(o: any): OrderOutput {
    return {
      orderId: o._id.toString(),
      userId: o.userId.toString(),
      assignedTo: o.assignedTo ? o.assignedTo.toString() : null,
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
    } as any;
  }

  // 🛒 Create a new order (requires auth)
  @UseGuards(GqlAuthGuard)
  @Mutation(() => OrderOutput, { name: 'createOrder' })
  async createOrder(
    @Args('input') input: CreateOrderInput,
    @CurrentUser() user: any,
  ): Promise<OrderOutput> {
    try {
      return await this.ordersService.createOrder(input, user.id as string);
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  // 📦 Get all orders for the current user (requires auth)
  @UseGuards(GqlAuthGuard)
  @Query(() => [OrderOutput], { name: 'userOrders' })
  async getUserOrders(@CurrentUser() user: any) {
    try {
      return await this.ordersService.findAllForUser(user.id);
    } catch (error) {
      throw new Error(`Failed to fetch user orders: ${error.message}`);
    }
  }

  // 🔄 Order lifecycle mutations (protected)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('restaurant')
  @Mutation(() => OrderOutput, { name: 'confirmOrder' })
  async confirmOrder(@Args('orderId', { type: () => ID }) orderId: string) {
    const o = await this.ordersService.updateStatus(orderId, 'confirmed');
    return this.toOrderOutput(o);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('restaurant')
  @Mutation(() => OrderOutput, { name: 'markPreparing' })
  async markPreparing(@Args('orderId', { type: () => ID }) orderId: string) {
    const o = await this.ordersService.updateStatus(orderId, 'preparing');
    return this.toOrderOutput(o);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('restaurant')
  @Mutation(() => OrderOutput, { name: 'markReady' })
  async markReady(@Args('orderId', { type: () => ID }) orderId: string) {
    const o = await this.ordersService.updateStatus(orderId, 'ready');
    return this.toOrderOutput(o);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('delivery')
  @Mutation(() => OrderOutput, { name: 'startDelivery' })
  async startDelivery(@Args('orderId', { type: () => ID }) orderId: string, @CurrentUser() user: any) {
    const o = await this.ordersService.startDelivery(orderId, user.id);
    return this.toOrderOutput(o);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('delivery')
  @Mutation(() => OrderOutput, { name: 'markDelivered' })
  async markDelivered(@Args('orderId', { type: () => ID }) orderId: string) {
    const o = await this.ordersService.updateStatus(orderId, 'delivered');
    return this.toOrderOutput(o);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('restaurant')
  @Mutation(() => OrderOutput, { name: 'cancelOrder' })
  async cancelOrder(@Args('orderId', { type: () => ID }) orderId: string) {
    const o = await this.ordersService.updateStatus(orderId, 'cancelled');
    return this.toOrderOutput(o);
  }

  // Assign order to a delivery user (admin/restaurant)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('restaurant')
  @Mutation(() => OrderOutput, { name: 'assignOrder' })
  async assignOrder(
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('deliveryUserId', { type: () => ID }) deliveryUserId: string,
  ) {
    const o = await this.ordersService.assignOrder(orderId, deliveryUserId);
    return this.toOrderOutput(o);
  }

  // List deliveries assigned to current delivery user
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('delivery')
  @Query(() => [OrderOutput], { name: 'myDeliveries' })
  async myDeliveries(@CurrentUser() user: any) {
    const orders = await this.ordersService.findDeliveriesForUser(user.id);
    return orders.map((o: any) => this.toOrderOutput(o));
  }

  // ===== Admin Queries =====
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('restaurant')
  @Query(() => [OrderOutput], { name: 'allOrders' })
  async allOrders(@Args('status', { type: () => String, nullable: true }) status?: string) {
    const orders = await this.ordersService.findAll(status);
    return orders.map((o: any) => this.toOrderOutput(o));
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('restaurant')
  @Query(() => [OrderOutput], { name: 'ordersByStatus' })
  async ordersByStatus(@Args('status', { type: () => String }) status: string) {
    const orders = await this.ordersService.findByStatus(status);
    return orders.map((o: any) => this.toOrderOutput(o));
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('restaurant')
  @Query(() => OrderStatisticsOutput, { name: 'orderStats' })
  async orderStats() {
    return this.ordersService.getOrderStats();
  }
}
