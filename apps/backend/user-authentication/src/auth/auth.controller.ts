import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() registerDto: any) {
    const { cin, password, nom, prenom } = registerDto;
    try {
      const user = await this.authService.register(cin, password, nom, prenom);
      return {
        message: 'User registered successfully',
        user: {
          id: user._id,
          cin: user.cin,
          nom: user.nom,
          prenom: user.prenom,
        },
      };
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }
}
