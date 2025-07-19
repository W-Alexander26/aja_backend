
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from './entity/user.entity';
import { Password } from './entity/password.entity';
import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }), TypeOrmModule.forFeature([User, Password]),],
  providers: [UserService],
  controllers: [UserController],
})
export class UsersModule { }