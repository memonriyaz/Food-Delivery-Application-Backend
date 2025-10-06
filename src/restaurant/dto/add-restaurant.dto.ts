import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEmail,
  IsArray,
} from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  // @IsString()
  // @IsNotEmpty()
  // owner: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}
