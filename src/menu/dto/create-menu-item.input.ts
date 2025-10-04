import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
export class NutritionalInfoInput {
  @Field(() => Float, { nullable: true })
  calories?: number;

  @Field(() => Float, { nullable: true })
  protein?: number;

  @Field(() => Float, { nullable: true })
  carbs?: number;

  @Field(() => Float, { nullable: true })
  fat?: number;
}

@InputType()
export class CreateMenuItemInput {
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

  @Field(() => NutritionalInfoInput, { nullable: true })
  nutritionalInfo?: NutritionalInfoInput;

  @Field({ nullable: true })
  isVegetarian?: boolean;

  @Field({ nullable: true })
  isVegan?: boolean;

  @Field({ nullable: true })
  isGlutenFree?: boolean;

  @Field({ nullable: true })
  isAvailable?: boolean;

  @Field({ nullable: true })
  preparationTime?: number;
}
