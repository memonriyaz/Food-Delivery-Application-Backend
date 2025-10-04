import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class OrderStatisticsOutput {
  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  placed!: number;

  @Field(() => Int)
  confirmed!: number;

  @Field(() => Int)
  preparing!: number;

  @Field(() => Int)
  ready!: number;

  @Field(() => Int)
  out_for_delivery!: number;

  @Field(() => Int)
  delivered!: number;

  @Field(() => Int)
  cancelled!: number;
}