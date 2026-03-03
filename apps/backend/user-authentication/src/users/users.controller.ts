import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  //UseGuards,
  Headers,
} from '@nestjs/common';
import { UsersService } from './users.service';
//import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('users')
//@UseGuards(JwtAuthGuard)      
export class UsersController {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  @Post()
  async create(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('mypermissions')
  async getProfile(@Headers('Authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No token provided' };
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = this.jwtService.verify(token);
      const userId = decoded.sub;
      return this.usersService.mypermission(userId);
    } catch (error) {
      return { error: 'Invalid token' };
    }
  }

  @Get('pending')
  async findPending() {
    return this.usersService.findPending();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Put('ban/:id')
  async ban(@Param('id') id: string) {
    return this.usersService.handleBan(id);
  }
}

