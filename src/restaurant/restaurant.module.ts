import { Module } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import {UploadsModule} from '../uploads/uploads.module'
import { RestaurantResolver } from './restaurant.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import {Restaurant , RestaurantSchema} from '../schemas/restaurant.schema'
import { User , UserSchema } from 'src/schemas/user.schema';
import { FoodItem, FoodItemSchema } from 'src/schemas/food-item.schema';
@Module({
  imports:[UploadsModule,
    MongooseModule.forFeature([
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: User.name, schema: UserSchema },
      {name:FoodItem.name , schema:FoodItemSchema}
    ])
  ],
  providers: [RestaurantService, RestaurantResolver],
  controllers: [RestaurantController]
})
export class RestaurantModule {}
