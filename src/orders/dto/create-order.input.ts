import { InputType, Field, ID, Int } from '@nestjs/graphql';

@InputType()
export class OrderItemInput {
  @Field(() => ID)
  menuItemId: string; // 🆔 ID of the menu item

  @Field(() => Int)
  quantity: number; // 🔢 Quantity selected for that menu item

  @Field({ nullable: true })
  specialInstructions?: string; // 📝 Optional note (e.g. "Extra cheese")
}

@InputType()
export class DeliveryAddressInput {
  @Field()
  street: string;

  @Field()
  city: string;

  @Field()
  state: string;

  @Field()
  zipCode: string;
}

@InputType()
export class CreateOrderInput {
  @Field(() => [OrderItemInput])
  items: OrderItemInput[]; // 🍕 List of ordered items with their quantity

  @Field(() => DeliveryAddressInput)
  deliveryAddress: DeliveryAddressInput; // 🏠 Delivery address for the order

  @Field({ nullable: true })
  notes?: string; // 📝 Optional overall order notes (e.g. "Leave at the door")
}
