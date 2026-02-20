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
<<<<<<< HEAD
    const user = await this.usersService.findByCin(cin);
    if (user && (await bcrypt.compare(password, user.motDePasse))) {
=======
    if (!cin || !password) {
      return null;
    }

    const user = await this.usersService.findByCin(cin);
    if (!user || !user.motDePasse) {
      return null;
    }

    if (await bcrypt.compare(password, user.motDePasse)) {
>>>>>>> origin/main
      const { motDePasse, ...result } = user.toObject ? user.toObject() : user;
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
<<<<<<< HEAD
      user: {
        id: user._id,
        cin: user.cin,
        nom: user.nom,
        prenom: user.prenom,
        roles: user.roles,
      },
    };
  }

  async register(cin: string, password: string, nom: string, prenom: string) {
=======
      
        id: user._id,
        cin: user.cin,
        lastname: user.lastname,
        firstname: user.firstname,
        role: user.role,
      
    };
  }

  async register(cin: string, password: string, firstname: string, lastname: string,role:string) {
>>>>>>> origin/main
    const existingUser = await this.usersService.findByCin(cin);
    if (existingUser) {
      throw new Error('User already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.usersService.create({
      cin,
      motDePasse: hashedPassword,
<<<<<<< HEAD
      nom,
      prenom,
=======
      lastname,
      firstname,
      role
>>>>>>> origin/main
    });
  }
}
