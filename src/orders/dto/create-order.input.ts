import { InputType, Field, ID, Int } from '@nestjs/graphql';
import {
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsInt,
  Min,
  IsString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class OrderItemInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  menuItemId: string; // 🆔 ID of the menu item

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number; // 🔢 Quantity selected for that menu item

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  specialInstructions?: string; // 📝 Optional note (e.g. "Extra cheese")
}

@InputType()
export class DeliveryAddressInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  street: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  city: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  state: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  zipCode: string;
}

@InputType()
export class CreateOrderInput {
  @Field(() => [OrderItemInput])
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[]; // 🍕 List of ordered items with their quantity

  @Field(() => DeliveryAddressInput)
  @ValidateNested()
  @Type(() => DeliveryAddressInput)
  deliveryAddress: DeliveryAddressInput; // 🏠 Delivery address for the order

  @Field({ nullable: true })
  @IsString()
  notes?: string; // 📝 Optional overall order notes (e.g. "Leave at the door")
}
