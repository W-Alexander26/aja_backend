import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Controller('proyectos')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('archivo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const result = await this.projectsService.uploadImage(file);
    return {
      url: result,
    };
  }

  @Post()
  crearProyecto(@Body() dto: CreateProjectDto) {
    return this.projectsService.crearProyecto(dto);
  }
}
