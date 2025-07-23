import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsUrl,
} from 'class-validator';

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

  @IsString()
  file: string;

}
