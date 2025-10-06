import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { CloudinaryService } from './cloudinary.service';
import { MenuModule } from '../menu/menu.module';

@Module({
  imports: [MenuModule],
  controllers: [UploadsController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class UploadsModule {}
