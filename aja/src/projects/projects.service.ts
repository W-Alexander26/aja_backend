import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyect } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
const toStream = require('buffer-to-stream'); // CommonJS compatible

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Proyect)
    private readonly proyectoRepo: Repository<Proyect>,
    private readonly configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'aja_recursos' },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error('No se recibió respuesta de Cloudinary'));
          }
          return resolve(result.secure_url);
        },
      );
      toStream(file.buffer).pipe(stream);
    });
  };


  async crearProyecto(dto: CreateProjectDto): Promise<Proyect> {
    const nuevoProyecto = this.proyectoRepo.create({
      ...dto,
    });
    return this.proyectoRepo.save(nuevoProyecto);
  }

  async obtenerTodos(): Promise<Proyect[]> {
    return this.proyectoRepo.find();
  }



}




