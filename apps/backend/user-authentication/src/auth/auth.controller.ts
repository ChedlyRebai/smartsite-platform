<<<<<<< HEAD
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
=======
import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
>>>>>>> origin/main
import { LoginDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
<<<<<<< HEAD
 @UseGuards(LocalAuthGuard)
  async login(@Request() req) {
    console.log("rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr",req)
    return this.authService.login(req.user);
=======
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.cin,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.authService.login(user);
>>>>>>> origin/main
  }

  @Post('register')
  async register(@Body() registerDto: any) {
<<<<<<< HEAD
    const { cin, password, nom, prenom } = registerDto;
    try {
      const user = await this.authService.register(cin, password, nom, prenom);
=======
    const { cin, password, firstname, lastname,role } = registerDto;
    try {
      const user = await this.authService.register(cin, password, firstname, lastname,role);
>>>>>>> origin/main
      return {
        message: 'User registered successfully',
        user: {
          id: user._id,
          cin: user.cin,
<<<<<<< HEAD
          nom: user.nom,
          prenom: user.prenom,
=======
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role
>>>>>>> origin/main
        },
      };
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }
}
