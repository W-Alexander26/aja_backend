import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, EntityManager, DataSource } from 'typeorm';
import { AuthDto, CreateUserDto, ListUsersDto, UpdateUserDto, User } from './entity/user.entity';
import { Password } from './entity/password.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Password) private passwordRepo: Repository<Password>,
    private configService: ConfigService,
    private dataSource: DataSource,
    private jwtService: JwtService,
  ) { }

  async findAll(dto: ListUsersDto) {
    return this.userRepo.find();
  }


  async create(dto: CreateUserDto) {
    const user = this.userRepo.create({
      username: dto.username,
      email: dto.email,
    });

    await this.userRepo.save(user);

    const hashed = await this.hashPassword(dto.password);
    const password = this.passwordRepo.create({ password: hashed, user });

    await this.passwordRepo.save(password);

    return user;
  }

  private async hashPassword(plain: string): Promise<string> {
    const secret = this.configService.get<string>('HASH_SECRET_KEY') ?? '';
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain + secret, salt);
  }

  async updateUser(dto: UpdateUserDto) {
    const user = await this.userRepo.findOneBy({ id: dto.id });
    if (!user) throw new Error('Usuario no encontrado');

    if (dto.username) user.username = dto.username;
    if (dto.email) user.email = dto.email;
    if (dto.activos !== undefined) user.activos = dto.activos;
    await this.userRepo.save(user);

    if (dto.password) {
      let password = await this.passwordRepo.findOne({
        where: { user: { id: dto.id } },
        relations: ['user'],
      });

      const hashed = await this.hashPassword(dto.password);

      if (!password) {
        password = this.passwordRepo.create({ password: hashed, user });
      } else {
        password.password = hashed;
      }

      await this.passwordRepo.save(password);
    }

    return { message: 'Usuario actualizado correctamente' };
  }

  async deleteUser(id: number) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new Error('Usuario no encontrado');

    user.activos = false;
    await this.userRepo.save(user);

    return { message: 'Usuario inactivado correctamente' };
  }


  async auth(data: AuthDto): Promise<{ accessToken: string; username: string; email: string }> {
    try {
      if (!data.username || !data.password) {
        throw new HttpException(
          'Username y contraseña son requeridos',
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = await this.dataSource.manager.transaction(async (manager) => {
        return this.getValidUser(data.username, data.password, manager);
      });

      const accessToken = await this.generateTokenWithUserData(user);

      return {
        accessToken,
        username: user.username,
        email: user.email,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Error en autenticación',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  private async getValidUser(username: string, password: string, manager: EntityManager): Promise<User> {
    const user = await manager.findOne(User, { where: { username } });
    if (!user) throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);

    const userPassword = await manager.findOne(Password, {
      where: { user: { id: user.id } },
      relations: ['user'],
    });
    if (user.activos == false) {
      throw new HttpException('Usuario inactivo', HttpStatus.FORBIDDEN);
    }
    if (!userPassword?.password) {
      throw new HttpException('Contraseña no encontrada', HttpStatus.NOT_FOUND);
    }

    const secret = process.env.HASH_SECRET_KEY ?? '';
    const isPasswordValid = await bcrypt.compare(password, userPassword.password);
    if (!isPasswordValid) {
      throw new HttpException('Contraseña inválida', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }


  private async generateTokenWithUserData(user: User) {
    const payload = { userId: user.id };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '24h',
    });
  }


}