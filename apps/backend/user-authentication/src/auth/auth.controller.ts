import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.cin,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() registerDto: any) {
    const { cin, password, firstname, lastname,role } = registerDto;
    try {
      const user = await this.authService.register(cin, password, firstname, lastname,role);
      return {
        message: 'User registered successfully',
        user: {
          id: user._id,
          cin: user.cin,
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role
        },
      };
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }
}
