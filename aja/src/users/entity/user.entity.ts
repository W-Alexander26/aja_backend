import { IsEmail, IsNotEmpty, IsOptional, MinLength, IsInt, IsBoolean } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Password } from './password.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  email: string;

  @Column({ default: true })
  activos: boolean;

  @OneToOne(() => Password, (password) => password.user)
  password: Password;
}


export class CreateUserDto {
  @IsNotEmpty({ message: 'El username no puede estar vacío' })
  username: string;

  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}

export class UpdateUserDto {
  @IsInt({ message: 'El ID debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID es obligatorio' })
  id: number;

  @IsOptional()
  @IsNotEmpty({ message: 'El username no puede estar vacío si se envía' })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser válido si se envía' })
  email?: string;

  @IsOptional()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;
}

export class DeleteUserDto {
  @IsInt({ message: 'El ID debe ser un número' })
  @IsNotEmpty({ message: 'El ID es obligatorio' })
  id: number;
}

export class ListUsersDto {
  @IsOptional()
  @IsBoolean()
  activos?: boolean;
}

export class AuthDto {
  @IsNotEmpty({ message: 'El username es obligatorio' })
  username: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}