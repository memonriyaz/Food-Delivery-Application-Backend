import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { UserOutput } from './dto/user.output';   // GraphQL return type (ObjectType)
import { CreateUserInput } from './dto/create-user.input';
import { Types } from 'mongoose';

@Resolver(() => UserOutput)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  /*
    - Mutation: Create new user
    - Returns created user
  */
 @Mutation(() => UserOutput)
async createUser(@Args('input') input: CreateUserInput): Promise<UserOutput> {
  const user = await this.usersService.createUser(input);
  return {
   id: (user._id as Types.ObjectId).toString(),
  ...user.toObject(),
  };
}

  /*
    - Query: Find user by email
  */
  @Query(() => UserOutput, { name: 'userByEmail' })
  async getUserByEmail(@Args('email') email: string) {
    return this.usersService.findOneByEmail(email);
  }

  /*
    - Query: Find user by ID
  */
  @Query(() => UserOutput, { name: 'userById' })
  async getUserById(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.findById(id);
  }
}
