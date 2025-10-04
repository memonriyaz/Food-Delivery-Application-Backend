import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsService } from './payments.service';
import { PaymentsResolver } from './payments.resolver';
import { PaymentsController } from './payments.controller';
import { Order, OrderSchema } from '../schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  providers: [PaymentsService, PaymentsResolver],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
