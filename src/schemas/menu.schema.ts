import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@Schema({ timestamps: true }) 
export class Menu extends Document {
 declare _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ enum: ['appetizer', 'main', 'dessert', 'beverage'], required: true })
  category: string;

  @Prop()
  imageUrl?: string;

  @Prop({ type: [String] })
  ingredients?: string[];

  @Prop({
    type: {
      calories: { type: Number },
      protein: { type: Number },
      carbs: { type: Number },
      fat: { type: Number },
    },
  })
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };

  @Prop({ default: false })
  isVegetarian: boolean;

  @Prop({ default: false })
  isVegan: boolean;

  @Prop({ default: false })
  isGlutenFree: boolean;

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop()
  preparationTime?: number; 
}

export const MenuSchema = SchemaFactory.createForClass(Menu);
