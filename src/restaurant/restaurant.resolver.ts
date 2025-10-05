import { Resolver, Query, Context } from '@nestjs/graphql';
import { RestaurantService } from './restaurant.service'
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard'
import { Restaurant } from '../schemas/restaurant.schema'


@Resolver(() => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) { }

  @Query(() => Restaurant)
  @UseGuards(GqlAuthGuard)
  async myRestaurant(@Context() context: any): Promise<Restaurant> {
    const user = context.req.user;
    if (!user || !user._id) {
      throw new Error('Unauthorized');
    }
    return this.restaurantService.getOwnerRestaurantWithFoodItems(user._id);
  }


}
