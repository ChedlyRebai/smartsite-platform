import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto';
import { log } from 'console';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private jwtService: JwtService,
  ) {}

  async validateUser(cin: string, password: string): Promise<any> {
    if (!cin || !password) {
      return null;
    }
    console.log("validate1",cin,"  ",password)
    const user = await this.usersService.findByCin(cin);
    console.log("before finding user",user)
    if (!user || !user.password) {
      return null;
    }
    console.log("finding user",user)
    console.log("find by cin");
    if (await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user.toObject ? user.toObject() : user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    console.log("Login user:", user);
    const payload = {
      cin: user.cin,
      sub: user._id,
      roles: user.roles || [],
    };
    console.log("JWT Payload:", payload);
    
    const userData = user.toObject ? user.toObject() : user;
    
    return {
      access_token: this.jwtService.sign(payload),
      id: userData._id,
      cin: userData.cin,
      lastname: userData.lastname,
      firstname: userData.firstname,
      role: userData.role || null,
    };
  }

  async register(cin: string, password: string, firstname: string, lastname: string, role: string) {
    const existingUser = await this.usersService.findByCin(cin);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Look up the role by name to get the ObjectId
    let roleId;
    if (role) {
      const roleEntity = await this.rolesService.findByName(role);
      if (roleEntity) {
        roleId = roleEntity._id;
      } else {
        // If role not found, use a default role or throw error
        throw new Error(`Role "${role}" not found`);
      }
    } else {
      throw new Error('Role is required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    return this.usersService.create({
      cin,
      password: hashedPassword,
      lastname,
      firstname,
      role: roleId
    });
  }
}
