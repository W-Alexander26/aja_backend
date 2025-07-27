import { Controller, Get, Post, Body, Delete, Patch } from '@nestjs/common';
import { UserService } from './users.service';
import { AuthDto, CreateUserDto, DeleteUserDto, ListUsersDto, UpdateUserDto } from './entity/user.entity';
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return await this.userService.create(dto);
  }

  @Get()
  async findAll(@Body() dto: ListUsersDto) {
    return await this.userService.findAll(dto);
  }

  @Patch('update')
  async updateUser(@Body() dto: UpdateUserDto) {
    return await this.userService.updateUser(dto);
  }

  @Delete('delete')
  async deleteUser(@Body() dto: DeleteUserDto) {
    return await this.userService.deleteUser(dto.id);
  }

  @Post('auth')
  async auth(@Body() dto: AuthDto) {
    return await this.userService.auth(dto)
  }
}
