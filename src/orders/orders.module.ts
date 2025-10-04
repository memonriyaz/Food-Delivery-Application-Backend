import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { Order, OrderSchema } from '../schemas/order.schema';
import { Menu, MenuSchema } from '../schemas/menu.schema';

@Module({
  imports: [
    // Register Mongoose models
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Menu.name, schema: MenuSchema },
    ]),
  ],
  providers: [OrdersService, OrdersResolver],
  exports: [OrdersService], // optional, if used in other modules
})
export class OrdersModule {}
