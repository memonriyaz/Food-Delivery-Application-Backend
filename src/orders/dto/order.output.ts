import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class OrderItemOutput {
  @Field()
  name: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  subTotal: number;
}

@ObjectType()
export class DeliveryAddressOutput {
  @Field()
  street: string;

  @Field()
  city: string;

  @Field()
  state: string;

  @Field()
  zipCode: string;
}

@ObjectType()
export class OrderOutput {
  @Field(() => ID)
  orderId: string;

  @Field(() => ID)
  userId: string;

  @Field(() => [OrderItemOutput])
  items: OrderItemOutput[];

  @Field(() => Float)
  totalAmount: number;

  @Field(() => DeliveryAddressOutput)
  deliveryAddress: DeliveryAddressOutput; // ✅ FIXED: now properly typed as an object

  @Field()
  status: string;

  @Field({ nullable: true })
  createdAt?: Date;
}
