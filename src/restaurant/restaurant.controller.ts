import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { JwtHttpAuthGuard } from '../auth/jwt-http.guard';
import { CreateRestaurantDto } from './dto/add-restaurant.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateFoodItemDto } from './dto/add-item.dto';

interface FileUpload {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

@Controller('restaurant')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get()
  @UseGuards(JwtHttpAuthGuard)
  getProfile(@Request() req: any): any {
    // console.log("Request", req)
    return req.user;
  }

  @Post('create-shop')
  @UseGuards(JwtHttpAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async createRestaurant(
    @UploadedFile() image: FileUpload,
    @Req() req: any,
    @Body() createRestaurantDto: CreateRestaurantDto,
  ) {
    const userId: string = req.user.id as string;
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
      filename,
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
    const userId: string = req.user?.id as string;

    const createFoodItemDto: CreateFoodItemDto = {
      name: body.name as string,
      price: body.price as number,
      type: body.type as string,
      category: body.category as string,
    };

    return this.restaurantService.addFoodItem(
      createFoodItemDto,
      userId,
      image?.buffer,
      image?.originalname,
    );
  }
}
