import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  UnauthorizedException,
  UseGuards,
  Delete,
  Query,
  ForbiddenException,
  Patch,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { JwtHttpAuthGuard } from '../auth/jwt-http.guard';
import { MenuService } from '../menu/menu.service';
import type { Request, Express } from 'express';

@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly cloudinary: CloudinaryService,
    private readonly menuService: MenuService,
  ) {}

  @Post('image')
  @UseGuards(JwtHttpAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadImage(@UploadedFile() file: any, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException(
        'No file uploaded. Use form-data with key "file"',
      );
    }

    // optional: require auth for upload via Authorization: Bearer <token>
    // JwtStrategy already sets req.user when valid; if not present, block upload
    const user: any = (req as any).user;
    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }
    if (user.role !== 'restaurant') {
      throw new ForbiddenException('Only restaurant users can upload images');
    }

    const mime = file.mimetype.toLowerCase();
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(mime)) {
      throw new BadRequestException(
        'Unsupported file type. Use PNG, JPG, or WEBP.',
      );
    }

    const { url, publicId } = await this.cloudinary.uploadImageBuffer(
      file.buffer,
      file.originalname,
    );
    return { url, publicId };
  }

  @Delete('image')
  @UseGuards(JwtHttpAuthGuard)
  async deleteImage(@Query('publicId') publicId: string, @Req() req: Request) {
    const user: any = (req as any).user;
    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }
    if (user.role !== 'restaurant') {
      throw new ForbiddenException('Only restaurant users can delete images');
    }
    if (!publicId || typeof publicId !== 'string') {
      throw new BadRequestException('publicId is required');
    }
    const res = await this.cloudinary.deleteImage(publicId);
    return res; // { result: 'ok' | 'not found' | '...' }
  }

  // Convenience endpoint: upload image and create a menu item in one request
  // multipart/form-data fields: file (image), name, price, category, description?
  @Post('menu-item')
  @UseGuards(JwtHttpAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadAndCreateMenuItem(
    @UploadedFile() file: any,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    if (!user) throw new UnauthorizedException('Unauthorized');
    if (user.role !== 'restaurant')
      throw new ForbiddenException(
        'Only restaurant users can create menu items',
      );

    if (!file)
      throw new BadRequestException(
        'No file uploaded. Use form-data with key "file"',
      );

    const mime = (file.mimetype || '').toLowerCase();
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(mime)) {
      throw new BadRequestException(
        'Unsupported file type. Use PNG, JPG, or WEBP.',
      );
    }

    const name = (body?.name ?? '').toString();
    const category = (body?.category ?? '').toString();
    const priceNum = parseFloat(body?.price);
    const description = body?.description
      ? body.description.toString()
      : undefined;

    if (!name) throw new BadRequestException('name is required');
    if (!category) throw new BadRequestException('category is required');
    if (!Number.isFinite(priceNum))
      throw new BadRequestException('price must be a number');

    const { url } = await this.cloudinary.uploadImageBuffer(
      file.buffer,
      file.originalname,
    );

    const created = await this.menuService.createMenuItem({
      name,
      description,
      price: priceNum,
      category,
      imageUrl: url,
      isAvailable: true,
    } as any);

    return created;
  }

  // Update only image for existing menu item; optional oldPublicId will be deleted if provided
  @Patch('menu-item/:id/image')
  @UseGuards(JwtHttpAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async updateMenuItemImage(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body('oldPublicId') oldPublicId: string | undefined,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    if (!user) throw new UnauthorizedException('Unauthorized');
    if (user.role !== 'restaurant')
      throw new ForbiddenException(
        'Only restaurant users can update menu images',
      );

    if (!id) throw new BadRequestException('id is required');
    if (!file)
      throw new BadRequestException(
        'No file uploaded. Use form-data with key "file"',
      );

    const mime = (file.mimetype || '').toLowerCase();
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(mime)) {
      throw new BadRequestException(
        'Unsupported file type. Use PNG, JPG, or WEBP.',
      );
    }

    const { url } = await this.cloudinary.uploadImageBuffer(
      file.buffer,
      file.originalname,
    );

    // Update DB first
    const updated = await this.menuService.updateMenuItem(id, {
      imageUrl: url,
    } as any);

    // Optionally delete old image
    if (oldPublicId && typeof oldPublicId === 'string') {
      try {
        await this.cloudinary.deleteImage(oldPublicId);
      } catch {}
    }

    return updated;
  }
}
