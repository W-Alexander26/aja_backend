import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';
    import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsUrl,
  IsArray
} from 'class-validator';
import { Type } from 'class-transformer';


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

  @IsOptional()
  @IsArray()
  @Type(() => Object) // o () => Object si son objetos variados
  archivos?: any[];

}
