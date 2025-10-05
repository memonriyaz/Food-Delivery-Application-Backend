import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { ObjectType, Field, Float } from "@nestjs/graphql";
import { Restaurant } from './restaurant.schema';

export type FoodItemDocument = FoodItem & Document;

export enum FoodCategory {
  BURGERS = 'Burgers',
  PIZZA = 'Pizza',
  DRINKS = 'Drinks',
  DESSERTS = 'Desserts',
  SNACKS = 'Snacks',
}

@Schema({ timestamps: true })
@ObjectType()
export class FoodItem {

  @Field()
  @Prop({ required: true })
  name: string;

  @Field(() => Float)
  @Prop({ required: true })
  price: number;

  @Field({ nullable: true })
  @Prop()
  image?: string;

  @Field()
  @Prop({
    type: String,
    enum: ["veg", "non-veg"],
    required: true,
  })
  type: string;

  @Field(() => Restaurant)
  @Prop({ type: Types.ObjectId, ref: "Restaurant", required: true })
  restaurant: Restaurant;

  @Field(() => String)
  @Prop({ required: true, enum: Object.values(FoodCategory) })
  category: FoodCategory;
}

export const FoodItemSchema = SchemaFactory.createForClass(FoodItem);
