import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';
    import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {

  @IsString()
  nombre: string;

  @IsString()
  descripcion: string;

  @IsBoolean()
  estado: boolean;

  @IsString()
  responsable: string;

  @IsString()
  categoria: string;

  @IsUrl()
  link: string;

  @IsString()
  ubicacion: string;

  @IsString()
  file: string;

}
