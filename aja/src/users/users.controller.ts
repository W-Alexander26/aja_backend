import { Controller, Get, Post, Body, Put, Delete } from '@nestjs/common';
import { UserService } from './users.service';
import { AuthDto, CreateUserDto, DeleteUserDto, ListUsersDto, UpdateUserDto } from './entity/user.entity';
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get()
  findAll(@Body() dto: ListUsersDto) {
    return this.userService.findAll(dto);
  }

  @Put('update')
  updateUser(@Body() dto: UpdateUserDto) {
    return this.userService.updateUser(dto);
  }

  @Delete('delete')
  deleteUser(@Body() dto: DeleteUserDto) {
    return this.userService.deleteUser(dto.id);
  }

  @Post('auth')
  async auth(@Body() dto: AuthDto) {
    return await this.userService.auth(dto)
  }
}
