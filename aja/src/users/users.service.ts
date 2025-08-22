import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
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
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      attempt++;
      try {
        return await this.dataSource.transaction(async (manager) => {
          const displayOrder = await this.getNextDisplayOrder(manager);

          const user = manager.create(User, {
            username: dto.username,
            email: dto.email,
            displayOrder,
            skills: dto.skills ?? [],
            mostrar: dto.mostrar ?? false,
            siglas: dto.siglas ?? 'X',
            puestos: dto.puestos ?? null,
            img: dto.img ?? null,
            activos: true,
          });

          await manager.save(user);

          const hashed = await this.hashPassword(dto.password);
          const password = manager.create('Password' as any, { password: hashed, user });
          await manager.save(password);

          return user;
        });
      } catch (err: any) {
        const duplicate =
          err?.code === 'ER_DUP_ENTRY' ||
          err?.code === '23505';
        if (duplicate && attempt < MAX_RETRIES) continue;
        throw err;
      }
    }

    throw new Error('No se pudo asignar un displayOrder único después de varios intentos');
  }

  private async hashPassword(plain: string): Promise<string> {
    const secret = this.configService.get<string>('HASH_SECRET_KEY') ?? '';
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain + secret, salt);
  }

  private async getMaxDisplayOrder(manager: EntityManager): Promise<number> {
    const row = await manager
      .createQueryBuilder(User, 'u')
      .select('MAX(u.displayOrder)', 'max')
      .getRawOne<{ max: number | null }>();
    return Number(row?.max ?? 0) || 0;
  }

  async updateUser(dto: UpdateUserDto) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: dto.id } });
      if (!user) throw new NotFoundException('Usuario no encontrado');

      // Campos “simples”
      const patch: Partial<User> = {};
      if (dto.username !== undefined) patch.username = dto.username;
      if (dto.email !== undefined) patch.email = dto.email;
      if (dto.activos !== undefined) patch.activos = dto.activos;
      if (dto.skills !== undefined) patch.skills = dto.skills;
      if (dto.mostrar !== undefined) patch.mostrar = dto.mostrar;
      if (dto.siglas !== undefined) patch.siglas = dto.siglas;
      if (dto.puestos !== undefined) patch.puestos = dto.puestos;
      if (dto.img !== undefined) patch.img = dto.img;

      if (Object.keys(patch).length) {
        await manager.update(User, { id: dto.id }, patch);
      }

      // Reordenamiento (si viene target)
      if (dto.displayOrder !== undefined) {
        await this.moveUserTo(manager, dto.id, dto.displayOrder);
      }

      // Password (si viene)
      if (dto.password) {
        let password = await manager
          .createQueryBuilder()
          .select('p')
          .from('password', 'p' as any) // o tu entity Password si la tenés
          .where('p.userId = :id', { id: dto.id })
          .getRawOne();

        const hashed = await this.hashPassword(dto.password);

        if (!password) {
          // usando entity de Password real:
          // const passEntity = manager.create(Password, { password: hashed, user: { id: dto.id } as any });
          // await manager.save(passEntity);
          await manager.query(
            'INSERT INTO password (password, user_id) VALUES (?, ?)',
            [hashed, dto.id],
          );
        } else {
          await manager.query(
            'UPDATE password SET password = ? WHERE user_id = ?',
            [hashed, dto.id],
          );
        }
      }

      return { message: 'Usuario actualizado correctamente' };
    });
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

  private async getNextDisplayOrder(manager: EntityManager): Promise<number> {
    const rows = await manager
      .createQueryBuilder(User, 'u')
      .select('u.displayOrder', 'displayOrder')
      .where('u.displayOrder IS NOT NULL')
      .orderBy('u.displayOrder', 'ASC')
      .getRawMany<{ displayOrder: number }>();

    let expected = 1;
    for (const r of rows) {
      const v = Number(r.displayOrder);
      if (v > expected) break;     // hueco encontrado
      if (v === expected) expected++;
      // si v < expected lo ignoramos (duplicado raro o nulls)
    }
    return expected; // si no hay huecos en medio, es el siguiente al último
  }

  // private async moveUserTo( manager: EntityManager,userId: number,target: number, ): Promise<void> {
  //   if (target < 1) throw new BadRequestException('displayOrder debe ser >= 1');

  //   const user = await manager.findOne(User, { where: { id: userId } });
  //   if (!user) throw new NotFoundException('Usuario no encontrado');

  //   // Si el usuario no tenía displayOrder, lo tratamos como al final
  //   let current = user.displayOrder ?? 0;
  //   if (current === 0) {
  //     const max = await this.getMaxDisplayOrder(manager);
  //     current = max + 1;
  //     await manager.update(User, { id: user.id }, { displayOrder: current });
  //   }

  //   // Ajuste si target es mayor al último + 1 -> lo mandamos de último
  //   const maxBefore = await this.getMaxDisplayOrder(manager);
  //   if (target > maxBefore) target = maxBefore; // o maxBefore + 1 si querés permitir crear hueco final
  //   if (target < 1) target = 1;

  //   if (target === current) return; // nada que mover

  //   // 1) Parking para no chocar unique
  //   const PARK = -user.id; // valor único temporal
  //   await manager
  //     .createQueryBuilder()
  //     .update(User)
  //     .set({ displayOrder: PARK })
  //     .where('id = :id', { id: user.id })
  //     .execute();

  //   if (target < current) {
  //     // Subiendo: [target, current-1] => +1
  //     await manager
  //       .createQueryBuilder()
  //       .update(User)
  //       .set({ displayOrder: () => 'display_order + 1' })
  //       .where('display_order BETWEEN :start AND :end', { start: target, end: current - 1 })
  //       .execute();
  //   } else {
  //     // Bajando: [current+1, target] => -1
  //     await manager
  //       .createQueryBuilder()
  //       .update(User)
  //       .set({ displayOrder: () => 'display_order - 1' })
  //       .where('display_order BETWEEN :start AND :end', { start: current + 1, end: target })
  //       .execute();
  //   }

  //   // 3) Colocar al usuario en el target
  //   await manager
  //     .createQueryBuilder()
  //     .update(User)
  //     .set({ displayOrder: target })
  //     .where('id = :id', { id: user.id })
  //     .execute();
  // }

  private async moveUserTo(
  manager: EntityManager,
  userId: number,
  target: number,
): Promise<void> {
  if (target < 1) throw new BadRequestException('displayOrder debe ser >= 1');

  const user = await manager.findOne(User, { where: { id: userId } });
  if (!user) throw new NotFoundException('Usuario no encontrado');

  // Si no tenía displayOrder, lo mandamos al final primero
  let current = user.displayOrder ?? 0;
  if (current === 0) {
    const max = await this.getMaxDisplayOrder(manager);
    current = max + 1;
    await manager.update(User, { id: user.id }, { displayOrder: current });
  }

  // Limitar target a rango válido
  const maxBefore = await this.getMaxDisplayOrder(manager);
  if (target > maxBefore) target = maxBefore;
  if (target < 1) target = 1;

  if (target === current) return;

  // OFFSET grande para "doble parking"
  const OFFSET = 100000;

  if (target < current) {
    // Subiendo: los que están en [target, current-1] deben subir +1
    // 1) Mover afectados a la banda alta (evita UNIQUE)
    await manager
      .createQueryBuilder()
      .update(User)
      .set({ displayOrder: () => `display_order + ${OFFSET}` })
      .where('display_order BETWEEN :start AND :end', { start: target, end: current - 1 })
      .execute();

    // 2) Colocar al usuario en el target
    await manager
      .createQueryBuilder()
      .update(User)
      .set({ displayOrder: target })
      .where('id = :id', { id: user.id })
      .execute();

    // 3) Bajar afectados a su nueva posición final (+1)
    await manager
      .createQueryBuilder()
      .update(User)
      .set({ displayOrder: () => `display_order - ${OFFSET} + 1` })
      .where('display_order BETWEEN :start AND :end', {
        start: target + OFFSET,
        end: (current - 1) + OFFSET,
      })
      .execute();

  } else {
    // Bajando: los que están en [current+1, target] deben bajar -1
    // 1) Mover afectados a la banda alta
    await manager
      .createQueryBuilder()
      .update(User)
      .set({ displayOrder: () => `display_order + ${OFFSET}` })
      .where('display_order BETWEEN :start AND :end', { start: current + 1, end: target })
      .execute();

    // 2) Colocar al usuario en el target
    await manager
      .createQueryBuilder()
      .update(User)
      .set({ displayOrder: target })
      .where('id = :id', { id: user.id })
      .execute();

    // 3) Bajar afectados a su nueva posición final (-1)
    await manager
      .createQueryBuilder()
      .update(User)
      .set({ displayOrder: () => `display_order - ${OFFSET} - 1` })
      .where('display_order BETWEEN :start AND :end', {
        start: (current + 1) + OFFSET,
        end: target + OFFSET,
      })
      .execute();
  }
}

}