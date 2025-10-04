import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';


export type UserDocument = User & Document;

export enum UserRole {
  USER = 'user',
  RESTAURANT = 'restaurant',
  DELIVERY = 'delivery',
}


@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: String, enum: Object.values(UserRole), default: UserRole.USER })
  role: UserRole;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  address?: string;
}


export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<UserDocument>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
})