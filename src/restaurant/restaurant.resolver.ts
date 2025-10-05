import { Resolver, Query, Context, Args } from '@nestjs/graphql';
import { RestaurantService } from './restaurant.service'
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard'
import { Restaurant } from '../schemas/restaurant.schema'
import { RecommendedItemOutput } from './dto/recommended-item.output'


@Resolver(() => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) { }

  @Query(() => Restaurant)
  @UseGuards(GqlAuthGuard)
  async myRestaurant(@Context() context: any): Promise<Restaurant> {
    const user = context.req.user;
    console.log('GraphQL User context:', user);
    
    if (!user || (!user.id && !user._id)) {
      throw new Error('Unauthorized');
    }
    
    // Handle both id and _id from JWT payload
    const userId = user.id || user._id;
    return this.restaurantService.getOwnerRestaurantWithFoodItems(userId);
  }

  @Query(() => [Restaurant], { name: 'restaurants' })
  async getAllRestaurants(): Promise<Restaurant[]> {
    return this.restaurantService.getAllRestaurants();
  }

  @Query(() => Restaurant, { name: 'restaurant' })
  async getRestaurant(@Args('id') id: string): Promise<Restaurant> {
    return this.restaurantService.getRestaurantWithFoodItems(id);
  }

  @Query(() => Restaurant, { name: 'restaurantByName' })
  async getRestaurantByName(@Args('name') name: string): Promise<Restaurant> {
    return this.restaurantService.getRestaurantByNameWithFoodItems(name);
  }

  @Query(() => [RecommendedItemOutput], { name: 'recommendedItems' })
  async getRecommendedItems(): Promise<RecommendedItemOutput[]> {
    return this.restaurantService.getRecommendedItems();
  }

}
