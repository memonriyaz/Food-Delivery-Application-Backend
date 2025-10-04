import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { Menu } from '../schemas/menu.schema';
import { CreateOrderInput } from './dto/create-order.input';
import { OrderOutput } from './dto/order.output'; // ✅ Add this

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Menu.name) private readonly menuModel: Model<Menu>,
  ) {}

  /*
    🛒 Place a new order
  */
  async createOrder(
    createOrderDto: CreateOrderInput,
    userId: string,
  ): Promise<OrderOutput> {
    this.logger.log(`createOrder called: userId=${userId}, items=${createOrderDto?.items?.length ?? 0}`);
    const { items, deliveryAddress, notes } = createOrderDto;

    try {
      // 1️⃣ Extract menu item IDs
      const menuItemIds = items.map((i) => new Types.ObjectId(i.menuItemId));

      // 2️⃣ Fetch menu items to get current prices
      const menuItems = await this.menuModel
        .find({ _id: { $in: menuItemIds }, isAvailable: true })
        .exec();

      if (menuItems.length !== items.length) {
        throw new NotFoundException(
          'Some menu items were not found or unavailable',
        );
      }

      // 3️⃣ Build order items snapshot
      const orderItems = items.map((item) => {
        const menuItem = menuItems.find(
          (m) => m._id.toString() === item.menuItemId,
        );
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
      this.logger.log(`createOrder saved: orderId=${(savedOrder._id as Types.ObjectId).toString()}, totalAmount=${totalAmount}`);

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
      throw new BadRequestException(
        `Failed to fetch user orders: ${error.message}`,
      );
    }
  }

  /*
    Delivery: find assigned orders for a delivery user
  */
  async findDeliveriesForUser(deliveryUserId: string): Promise<Order[]> {
    try {
      return this.orderModel
        .find({ assignedTo: new Types.ObjectId(deliveryUserId) })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch deliveries: ${error.message}`,
      );
    }
  }

  /*
    Admin/Restaurant: assign order to a delivery user
  */
  async assignOrder(orderId: string, deliveryUserId: string): Promise<Order> {
    try {
      const updated = await this.orderModel
        .findByIdAndUpdate(
          orderId,
          { assignedTo: new Types.ObjectId(deliveryUserId) },
          { new: true },
        )
        .exec();
      if (!updated) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }
      return updated;
    } catch (error) {
      throw new BadRequestException(`Failed to assign order: ${error.message}`);
    }
  }

  /*
    Delivery: start delivery by assigning the current delivery user and moving to out_for_delivery
  */
  async startDelivery(orderId: string, deliveryUserId: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order with ID ${orderId} not found`);

    // Validate transition from current to out_for_delivery
    const allowedFrom = {
      placed: [],
      confirmed: [],
      preparing: [],
      ready: ['out_for_delivery'],
      out_for_delivery: [],
      delivered: [],
      cancelled: [],
    } as Record<string, string[]>;

    const from = order.status as string;
    if (!allowedFrom[from] || !allowedFrom[from].includes('out_for_delivery')) {
      throw new BadRequestException(`Invalid transition from ${from} to out_for_delivery`);
    }

    order.assignedTo = new Types.ObjectId(deliveryUserId);
    order.status = 'out_for_delivery';
    await order.save();
    return order;
  }

  // Admin: list all orders (optional filter by status)
  async findAll(status?: string): Promise<Order[]> {
    const filter = status ? { status } : {};
    try {
      return this.orderModel.find(filter).sort({ createdAt: -1 }).exec();
    } catch (error) {
      throw new BadRequestException(`Failed to fetch orders: ${error.message}`);
    }
  }

  // Admin: list orders by status
  async findByStatus(status: string): Promise<Order[]> {
    try {
      return this.orderModel.find({ status }).sort({ createdAt: -1 }).exec();
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch orders by status: ${error.message}`,
      );
    }
  }

  // Admin: basic stats by status
  async getOrderStats() {
    const pipeline = [
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ];
    const rows = await this.orderModel.aggregate(pipeline).exec();
    const result: any = {
      total: 0,
      placed: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const r of rows) {
      result[r._id] = r.count;
      result.total += r.count;
    }
    return result;
  }

  /*
    ⚙️ Update order status with basic transition validation
  */
  async updateStatus(
    orderId: string,
    next: string,
  ) {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const allowed: Record<string, string[]> = {
      placed: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['out_for_delivery', 'cancelled'],
      out_for_delivery: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    const from = order.status as string;
    if (!allowed[from] || !allowed[from].includes(next)) {
      throw new BadRequestException(`Invalid transition from ${from} to ${next}`);
    }

    order.status = next;

    if (next === 'delivered') {
      order.actualDeliveryTime = new Date();
    }
    await order.save();
    return order;
  }
}
