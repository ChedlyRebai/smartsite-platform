import { Controller, Post, Body, UnauthorizedException, Param, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    console.log('user:', loginDto);
    const user = await this.authService.validateUser(
      loginDto.cin,
      loginDto.password,
    );
    console.log('valdiate user:', user);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() registerDto: any) {
    const {
      cin,
      password,
      firstname,
      lastname,
      role,
      email,
      telephone,
      departement,
      adresse,
    } = registerDto;

    const user = await this.authService.register(
      cin,
      password,
      firstname,
      lastname,
      role,
      email,
      telephone,
      departement,
      adresse,
    );

    return {
      message: 'User registered successfully',
      user: {
        id: user._id,
        cin: user.cin,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        telephone: user.telephone,
        departement: user.departement,
        address: user.address,
        role: user.role,
      },
    };
  }

  @Post('approve-user/:userId')
  @UseGuards(JwtAuthGuard)
  async approveUser(
    @Param('userId') userId: string,
    @Body() body: { password: string },
    @Request() req: any,
  ) {
    const adminId = req.user.sub;
    const updatedUser = await this.authService.approveUser(
      userId,
      body.password,
      adminId,
    );
    return {
      message: 'User approved successfully',
      user: updatedUser,
    };
  }
}