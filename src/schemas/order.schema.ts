import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop([{
    menuItemId: { type: Types.ObjectId, ref: 'Menu', required: true },
    name: { type: String, required: true },       // snapshot
    price: { type: Number, required: true },      // snapshot
    quantity: { type: Number, required: true, min: 1 },
    specialInstructions: { type: String },
  }])
  items: {
    menuItemId: Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    specialInstructions?: string;
  }[];

  @Prop({
    type: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    required: true,
  })
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };

  @Prop({
    enum: ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'placed',
  })
  status: string;

  @Prop({ required: true })
  totalAmount: number;

  @Prop()
  paymentIntentId?: string;

  @Prop({
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  })
  paymentStatus: string;

  @Prop()
  estimatedDeliveryTime?: Date;

  @Prop()
  actualDeliveryTime?: Date;

  @Prop()
  notes?: string;

   @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
