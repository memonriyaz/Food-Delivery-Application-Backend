import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { ObjectType, Field, ID } from "@nestjs/graphql";
import { User } from "./user.schema";

export type RestaurantDocument = Restaurant & Document;

@Schema({ timestamps: true })
@ObjectType()

export class Restaurant {
    @Field()
    @Prop({ required: true })
    name: string;

    @Field({ nullable: true })
    @Prop()
    image?: string;

    @Field()
    @Prop({ required: true })
    city: string;

    @Field()
    @Prop({ required: true })
    state: string;


    @Field()
    @Prop({ required: true })
    address: string;

    @Field()
    @Prop({ required: true })
    phone: string;

    @Field()
    @Prop({ required: true })
    email: string;

    @Prop({ type: Types.ObjectId, ref: "User", required: true })
    owner?: Types.ObjectId;



}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);