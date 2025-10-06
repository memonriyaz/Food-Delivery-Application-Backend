/* eslint-disable prettier/prettier */
import { InputType, Field, Float } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  IsBoolean,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class NutritionalInfoInput {
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  calories?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  protein?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  carbs?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  fat?: number;
}

@InputType()
export class CreateMenuItemInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  price: number;

  @Field()
  @IsString()
  @IsIn(['appetizer', 'main', 'dessert', 'beverage'])
  category: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  ingredients?: string[];

  @Field(() => NutritionalInfoInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => NutritionalInfoInput)
  nutritionalInfo?: NutritionalInfoInput;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isVegetarian?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isVegan?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isGlutenFree?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  preparationTime?: number;
}
