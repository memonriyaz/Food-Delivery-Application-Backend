import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ enum: ['customer', 'admin'], default: 'customer' })
  role: string;

  @Prop()
  phone?: string;

  @Prop([{
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    isDefault: { type: Boolean, default: false }
  }])
  addresses: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
  }[];
}

export const UserSchema = SchemaFactory.createForClass(User);
