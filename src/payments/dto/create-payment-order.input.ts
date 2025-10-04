import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class CreatePaymentOrderInput {
  @Field(() => Float)
  orderAmount!: number;

  @Field({ nullable: true, defaultValue: 'INR' })
  orderCurrency?: string;

  @Field()
  customerId!: string;

  @Field()
  customerPhone!: string;
}
