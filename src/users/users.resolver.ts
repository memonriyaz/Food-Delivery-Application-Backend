import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserOutput } from './dto/user.output';
import { UpdateProfileInput } from './dto/update-profile.input';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Resolver(() => UserOutput)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  // Current user (requires JWT)
  @UseGuards(GqlAuthGuard)
  @Query(() => UserOutput, { name: 'me' })
  async me(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  // Update profile (requires JWT)
  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserOutput, { name: 'updateMyProfile' })
  async updateMyProfile(
    @CurrentUser() user: any,
    @Args('input') input: UpdateProfileInput,
  ) {
    return this.usersService.updateProfile(user.id, input);
  }

  // Query: Find user by email
  @Query(() => UserOutput, { name: 'userByEmail' })
  async getUserByEmail(@Args('email') email: string) {
    return this.usersService.findOneByEmail(email);
  }

  // Query: Find user by ID
  @Query(() => UserOutput, { name: 'userById' })
  async getUserById(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.findById(id);
  }
}
