import {
  IsEmail,
  IsEnum,
  IsLowercase,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../schemas/user.schema';

export class SignupDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  // @IsPhoneNumber()
  // @IsString()
  // @IsNotEmpty()
  // @Matches(/^[6-9]\d{9}$/, {
  //     message: 'Phone number must be a valid 10-digit Indian number',
  // })
  phone: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid Role' })
  role?: UserRole;
}
