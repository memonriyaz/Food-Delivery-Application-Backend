import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class CreatePaymentForOrderInput {
  @Field(() => ID)
  orderId!: string;

  @Field()
  customerPhone!: string;
}
