// create-food-item.dto.ts
import { InputType, Field, Float, ID } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional } from "class-validator";

@InputType()
export class CreateFoodItemDto {
  @Field()
  name: string;

  @Field(() => Float)
  price: number;

  @Field({ nullable: true })
  image?: string;

  @Field()
  type: string; // "veg" | "non-veg"


  @Field()
  @IsNotEmpty()
  category: string;
}
