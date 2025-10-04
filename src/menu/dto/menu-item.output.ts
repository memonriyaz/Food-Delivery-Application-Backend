import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class NutritionalInfoOutput {
  @Field(() => Float, { nullable: true })
  calories?: number;

  @Field(() => Float, { nullable: true })
  protein?: number;

  @Field(() => Float, { nullable: true })
  carbs?: number;

  @Field(() => Float, { nullable: true })
  fat?: number;
}

@ObjectType()
export class MenuItemOutput {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  price: number;

  @Field()
  category: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field(() => [String], { nullable: true })
  ingredients?: string[];

  @Field(() => NutritionalInfoOutput, { nullable: true })
  nutritionalInfo?: NutritionalInfoOutput;

  @Field()
  isVegetarian: boolean;

  @Field()
  isVegan: boolean;

  @Field()
  isGlutenFree: boolean;

  @Field()
  isAvailable: boolean;

  @Field({ nullable: true })
  preparationTime?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
