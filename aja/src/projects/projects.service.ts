import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
const toStream = require('buffer-to-stream'); // ✅ funciona con CommonJS


@Injectable()
export class ProjectsService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }
  
  async uploadImage(file: Express.Multer.File): Promise<any> {

    try {
       return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'aja_recursos' },
        (error, result) => {
          if (error) return reject(error);
          return resolve(result);
        },
      );
      toStream(file.buffer).pipe(stream);
    });
    } catch (error) {
      console.log(error);
    }
   
  }
}
