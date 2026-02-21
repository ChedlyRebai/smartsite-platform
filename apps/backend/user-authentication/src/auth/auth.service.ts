import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(cin: string, password: string): Promise<any> {
    if (!cin || !password) {
      return null;
    }

    const user = await this.usersService.findByCin(cin);
    if (!user || !user.password) {
      return null;
    }

    if (await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user.toObject ? user.toObject() : user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    console.log("user::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::",user)
    const payload = {
      cin: user.cin,
      sub: user._id,
      roles: user.roles || [],
    };
    return {
      access_token: this.jwtService.sign(payload),
      
        id: user._id,
        cin: user.cin,
        lastname: user.lastname,
        firstname: user.firstname,
        role: user.role,
      
    };
  }

  async register(cin: string, password: string, firstname: string, lastname: string,role:string) {
    const existingUser = await this.usersService.findByCin(cin);
    if (existingUser) {
      throw new Error('User already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.usersService.create({
      cin,
      password: hashedPassword,
      lastname,
      firstname,
      role
    });
  }
}
