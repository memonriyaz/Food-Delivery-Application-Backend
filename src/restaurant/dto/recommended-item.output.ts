import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class RestaurantInfo {
  @Field(() => ID)
  _id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field()
  address: string;
}

@ObjectType()
export class RecommendedItemOutput {
  @Field(() => ID)
  _id: string;

  @Field()
  name: string;

  @Field(() => Float)
  price: number;

  @Field({ nullable: true })
  image?: string;

  @Field()
  category: string;

  @Field({ nullable: true })
  type?: string;

  @Field(() => RestaurantInfo)
  restaurant: RestaurantInfo;
}