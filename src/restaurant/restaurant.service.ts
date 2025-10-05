import { Injectable, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Restaurant, RestaurantDocument } from 'src/schemas/restaurant.schema';
import { CreateRestaurantDto } from './dto/add-restaurant.dto';
import { User, UserDocument } from 'src/schemas/user.schema';
import { CloudinaryService } from '../uploads/cloudinary.service'
import { FoodItem, FoodItemDocument } from 'src/schemas/food-item.schema';
import { CreateFoodItemDto } from './dto/add-item.dto';
@Injectable()
export class RestaurantService {
    constructor(
        @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(FoodItem.name) private readonly foodItemModel: Model<FoodItemDocument>,
        private readonly cloudinary: CloudinaryService,
    ) { }

    /**
     * Creates a new restaurant for a user with role 'restaurant'.
     * Uploads the restaurant image if provided and saves all details including optional short description.
     *
     * @param createRestaurantDto - Object containing restaurant details (name, city, state, address, phone, email, description)
     * @param userId - ID of the user creating the restaurant
     * @param imageBuffer - Optional buffer of the restaurant image to upload
     * @param filename - Optional filename for the image upload
     * @returns The newly created restaurant document
     * @throws BadRequestException if user not found, user already owns a restaurant, or other DB errors occur
     * @throws ForbiddenException if the user role is not 'restaurant'
     */

    async createRestaurant(createRestaurantDto: CreateRestaurantDto, userId: string, imageBuffer?: Buffer, filename?: string,): Promise<Restaurant> {
        try {
            if (!userId) {
                throw new BadRequestException('User id is required');
            }
            // Get the user from DB
            const user = await this.userModel.findById(userId);
            if (!user) {
                throw new BadRequestException('User not found');
            }

            // Check if user role is 'restaurant'
            if (user.role !== 'restaurant') {
                throw new ForbiddenException('User is not allowed to create a restaurant');
            }

            // Check if the user already has a restaurant
            const userObjectId = new Types.ObjectId(userId);
            const existingRestaurant = await this.restaurantModel.findOne({ owner: userObjectId });
            if (existingRestaurant) {
                throw new BadRequestException('User already owns a restaurant');
            }

            // 4️ Upload image if buffer is provided
            let imageUrl: string | undefined;
            if (imageBuffer) {
                const { url } = await this.cloudinary.uploadImageBuffer(imageBuffer, filename);
                imageUrl = url;
            }

            const restuarant = new this.restaurantModel({
                ...createRestaurantDto,
                owner: userObjectId,
                image: imageUrl
            })

            //Create the restaurant
            const savedRestaurant = await restuarant.save();

            return savedRestaurant;

        } catch (error) {
            throw new BadRequestException('Failed to create restaurant' + error);
        }
    }

    /**
    * Adds a new food item to a restaurant owned by the given user.
    * Uploads the food image if provided and links the item to the user's restaurant.
    *
    * @param createFoodItemDto - Object containing food item details (name, price, type, category)
    * @param userId - ID of the user adding the food item
    * @param imageBuffer - Optional buffer of the food item image to upload
    * @param filename - Optional filename for the image upload
    * @returns The newly created FoodItem document
    * @throws BadRequestException if the restaurant is not found or saving fails
    * @throws ForbiddenException if the user is not the owner of the restaurant
    */

    async addFoodItem(createFoodItemDto: CreateFoodItemDto, userId: string, imageBuffer?: Buffer, filename?: string,): Promise<FoodItem> {
        try {


            const restaurant = await this.restaurantModel.findOne({ owner: new Types.ObjectId(userId) });
            if (!restaurant) {
                throw new BadRequestException('Restaurant not found');
            }

            if (restaurant?.owner?.toString() !== userId) {
                throw new ForbiddenException('You are not allowed to add food items to this restaurant');
            }
            
            let imageUrl: string | undefined;
            if (imageBuffer) {
                const { url } = await this.cloudinary.uploadImageBuffer(imageBuffer, filename);
                imageUrl = url;
            }



            const foodItem = new this.foodItemModel({
                ...createFoodItemDto,
                restaurant: restaurant._id,
                image: imageUrl
            });

            return await foodItem.save();

        } catch (error) {
            throw new BadRequestException('Failed to create Food Item' + error);
        }
    }
    /**
     * Fetches a restaurant owned by a specific user along with all its food items.
     *
     * @param userId - ID of the user whose restaurant is being fetched
     * @returns An object containing restaurant details and an array of associated food items
     * @throws BadRequestException if userId is not provided, no restaurant is found, or fetching fails
     */
    async getOwnerRestaurantWithFoodItems(userId: string): Promise<any> {
        try {
            if (!userId) {
                throw new BadRequestException('User ID is required');
            }

            // Convert string to ObjectId for proper MongoDB query
            const objectId = new Types.ObjectId(userId);
            
            // Fetch restaurant and populate owner
            const restaurant = await this.restaurantModel
                .findOne({ owner: objectId })
                .populate('owner')
                .exec();

            if (!restaurant) {
                throw new BadRequestException('No restaurant found for this user');
            }

            // Fetch related food items
            const foodItems = await this.foodItemModel
                .find({ restaurant: restaurant._id })
                .exec();



            // Return combined result
            return {
                ...restaurant.toObject(),
                foodItems,
            };
        } catch (error) {
            console.error('Error fetching restaurant with food items:', error);
            throw new BadRequestException('Failed to fetch restaurant: ' + (error.message || error));
        }
    }






}
