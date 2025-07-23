import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsUrl,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProjectDto {
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
