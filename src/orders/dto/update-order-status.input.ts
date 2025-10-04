import { InputType, Field, ID } from '@nestjs/graphql';
import { IsIn, IsMongoId } from 'class-validator';

@InputType()
export class UpdateOrderStatusInput {
  @Field(() => ID)
  @IsMongoId()
  id: string;

  @Field()
  @IsIn([
    'placed',
    'confirmed',
    'preparing',
    'ready',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ])
  status: string;
}
