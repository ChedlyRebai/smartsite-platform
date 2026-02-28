import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
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
      firstName,
      lastName,
      role,
      email,
<<<<<<< HEAD
      telephone,
=======
      phoneNumber,

>>>>>>> ee5b7420 (feat: enhance registration form with password and confirm password fields)
      adresse,
      companyName,
    } = registerDto;
    const user = await this.authService.register(
      cin,
      password,
      firstName,
      lastName,
      role,
      email,
<<<<<<< HEAD
      telephone,
=======
      phoneNumber,

>>>>>>> ee5b7420 (feat: enhance registration form with password and confirm password fields)
      adresse,
      companyName,
    );

    return {
      message: 'User registered successfully',
      user: {
        id: user._id,
        cin: user.cin,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
<<<<<<< HEAD
        telephone: user.telephone,
=======
        phoneNumber: user.phoneNumber,

>>>>>>> ee5b7420 (feat: enhance registration form with password and confirm password fields)
        address: user.address,
        role: user.role,
        companyName: user.companyName,
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

  @Post('verify-otp')
  async verifyOTP(@Body() body: { cin: string; otp: string }) {
    return this.authService.verifyOTP(body.cin, body.otp);
  }

  @Post('resend-otp')
  async resendOTP(@Body() body: { cin: string }) {
    return this.authService.resendOTP(body.cin);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; resetCode: string; newPassword: string },
  ) {
    return this.authService.resetPassword(
      body.email,
      body.resetCode,
      body.newPassword,
    );
  }

  @Post('resend-reset-code')
  async resendResetCode(@Body() body: { email: string }) {
    return this.authService.resendResetCode(body.email);
  }
}
