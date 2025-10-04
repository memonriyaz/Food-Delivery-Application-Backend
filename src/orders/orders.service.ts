import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { Menu } from '../schemas/menu.schema';
import { CreateOrderInput } from './dto/create-order.input';
import { OrderOutput } from './dto/order.output'; // ✅ Add this

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Menu.name) private readonly menuModel: Model<Menu>,
  ) {}

  /*
    🛒 Place a new order
  */
  async createOrder(createOrderDto: CreateOrderInput, userId: string): Promise<OrderOutput> {
    const { items, deliveryAddress, notes } = createOrderDto;

    try {
      // 1️⃣ Extract menu item IDs
      const menuItemIds = items.map((i) => new Types.ObjectId(i.menuItemId));

      // 2️⃣ Fetch menu items to get current prices
      const menuItems = await this.menuModel
        .find({ _id: { $in: menuItemIds }, isAvailable: true })
        .exec();

      if (menuItems.length !== items.length) {
        throw new NotFoundException('Some menu items were not found or unavailable');
      }

      // 3️⃣ Build order items snapshot
      const orderItems = items.map((item) => {
        const menuItem = menuItems.find((m) => m._id.toString() === item.menuItemId);
        if (!menuItem) {
          throw new NotFoundException(`Menu item ${item.menuItemId} not found`);
        }

        return {
          menuItemId: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: item.quantity,
          subTotal: menuItem.price * item.quantity,
        };
      });

      // 4️⃣ Calculate total amount
      const totalAmount = orderItems.reduce((sum, i) => sum + i.subTotal, 0);

      // 5️⃣ Create and save order
      const newOrder = new this.orderModel({
        userId,
        items: orderItems,
        totalAmount,
        deliveryAddress,
        notes: notes || '',
        status: 'placed',
        paymentStatus: 'pending',
      });

      const savedOrder = await newOrder.save();

      // 6️⃣ Return clean response
    return {
  orderId: (savedOrder._id as Types.ObjectId).toString(),
  userId: savedOrder.userId.toString(),
  totalAmount,
  items: orderItems.map((i) => ({
    name: i.name,
    quantity: i.quantity,
    price: i.price,
    subTotal: i.subTotal,
  })),
  deliveryAddress: savedOrder.deliveryAddress,
  status: savedOrder.status,
  createdAt: savedOrder.createdAt ?? new Date(), // ✅ handles optional createdAt
};
    } catch (error) {
      throw new BadRequestException(`Failed to create order: ${error.message}`);
    }
  }

  /*
    📦 Get all orders for a specific user
  */
  async findAllForUser(userId: string): Promise<Order[]> {
    try {
      return this.orderModel.find({ userId }).sort({ createdAt: -1 }).exec();
    } catch (error) {
      throw new BadRequestException(`Failed to fetch user orders: ${error.message}`);
    }
  }
}
