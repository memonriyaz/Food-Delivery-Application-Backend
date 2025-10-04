import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PaymentOrderOutput {
  @Field(() => String, { nullable: true })
  orderId!: string | null;

  @Field(() => String, { nullable: true })
  paymentSessionId!: string | null;
}
