import { Controller, Post, Body, Req, BadRequestException, UseGuards, Get, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { RestaurantService } from './restaurant.service'
import { JwtHttpAuthGuard } from '../auth/jwt-http.guard'
import { CreateRestaurantDto } from './dto/add-restaurant.dto'
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateFoodItemDto } from './dto/add-item.dto';

interface FileUpload {
    originalname: string;
    buffer: Buffer;
    mimetype: string;
}

@Controller('restaurant')
export class RestaurantController {
    constructor(private readonly restaurantService: RestaurantService) { }

    @Get()
    @UseGuards(JwtHttpAuthGuard)
    getProfile(@Request() req) {
        // console.log("Request", req)
        return req.user;
    }

    @Post('create-shop')
    @UseGuards(JwtHttpAuthGuard)
    @UseInterceptors(FileInterceptor('image'))
    async createRestaurant(
        @UploadedFile() image: FileUpload,
        @Req() req: any,
        @Body() createRestaurantDto: CreateRestaurantDto
    ) {
        const userId = req.user.id;
        let imageBuffer: Buffer | undefined;
        let filename: string | undefined;

        if (image) {
            imageBuffer = image.buffer;
            filename = image.originalname;
        }

        return this.restaurantService.createRestaurant(
            createRestaurantDto,
            userId,
            imageBuffer,
            filename
        );
    }


    @Post('create-item')
    @UseGuards(JwtHttpAuthGuard)
    @UseInterceptors(FileInterceptor('image'))
    async createFoodItem(
        @UploadedFile() image: FileUpload,
        @Req() req: any,
        @Body() body: any, 
    ) {
        const userId = req.user?.id;

        const createFoodItemDto: CreateFoodItemDto = {
            name: body.name,
            price: body.price,
            type: body.type,
            category: body.category,
        };

        return this.restaurantService.addFoodItem(
            createFoodItemDto,
            userId,
            image?.buffer,
            image?.originalname
        );
    }

}
