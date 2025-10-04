import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { CreateUserInput } from './dto/create-user.input';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  /* - Create user with unique email check
    - Throws ConflictException if email already exists
    - Catches duplicate key error from MongoDB
    */
  async createUser(createUserDto: CreateUserInput): Promise<User> {
    try {
      // check if email already exists
      const existingUser = await this.userModel
        .findOne({ email: createUserDto.email })
        .exec();
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const newUser = new this.userModel(createUserDto);
      return await newUser.save();
    } catch (error) {
      // handle duplicate key error (E11000 from MongoDB)
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  /*
    - Find user by email
    - Throws NotFoundException if user not found
  */
  async findOneByEmail(email: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // rethrow NotFoundException
      }
      throw new Error(
        `An error occurred while fetching the user by email: ${error.message}`,
      );
    }
  }
  /*
    - Find user by ID
    - Throws NotFoundException if user not found
  */
  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /*
    - Update profile fields for a user
  */
  async updateProfile(
    userId: string,
    dto: { name?: string; phone?: string; address?: string },
  ) {
    const updated = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
          ...(dto.address !== undefined ? { address: dto.address } : {}),
        },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return updated;
  }
}
