import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { OrdersService } from './orders.service';
import { CreateOrderInput } from './dto/create-order.input';
import { OrderOutput } from './dto/order.output';

@Resolver(() => OrderOutput) // ✅ FIXED: Should use OrderOutput, not OrderItemOutput
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  // 🛒 Create a new order
  @Mutation(() => OrderOutput, { name: 'createOrder' })
  async createOrder(
    @Args('input') input: CreateOrderInput,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<OrderOutput> {
    try {
      return await this.ordersService.createOrder(input, userId);
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  // 📦 Get all orders for a specific user
  @Query(() => [OrderOutput], { name: 'userOrders' })
  async getUserOrders(@Args('userId', { type: () => ID }) userId: string) {
    try {
      return await this.ordersService.findAllForUser(userId);
    } catch (error) {
      throw new Error(`Failed to fetch user orders: ${error.message}`);
    }
  }
}
