import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiOptions, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async uploadImageBuffer(
    buffer: Buffer,
    filename?: string,
  ): Promise<{ url: string; publicId: string }> {
    try {
      const folder = process.env.CLOUDINARY_FOLDER || 'food-delivery/menu';
      
      // Generate unique filename to prevent overwrites
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const uniqueFilename = filename 
        ? `${filename.split('.')[0]}_${timestamp}_${randomSuffix}`
        : `image_${timestamp}_${randomSuffix}`;
      
      const options: UploadApiOptions = {
        folder,
        resource_type: 'image',
        public_id: uniqueFilename,
        unique_filename: true,
        overwrite: false,
      };

      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(options, (error, res) => {
          if (error || !res) return reject(error);
          resolve(res);
        });
        streamifier.createReadStream(buffer).pipe(upload);
      });

     

      return { url: result.secure_url, publicId: result.public_id };
    } catch (err: any) {
      throw new InternalServerErrorException('Cloudinary upload failed: ' + err?.message);
    }
  }

  async deleteImage(publicId: string): Promise<{ result: string }> {
    try {
      if (!publicId || typeof publicId !== 'string') {
        throw new BadRequestException('publicId is required');
      }
      const res = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
        invalidate: true,
      });
      return { result: res.result } as { result: string };
    } catch (err: any) {
      throw new InternalServerErrorException('Cloudinary delete failed: ' + err?.message);
    }
  }
}
