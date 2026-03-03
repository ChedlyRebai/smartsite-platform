import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RolesService } from '../roles/roles.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private rolesService: RolesService,
  ) {}

  // ✅ FIXED VALIDATE USER
  async validateUser(cin: string, password: string): Promise<any> {
    if (!cin || !password) {
      return null;
    }

    console.log('🔍 validateUser:', cin);

    const user = await this.usersService.findByCin(cin);

    if (!user) {
      console.log('❌ User not found');
      return null;
    }

    // ✅ option sécurité (recommandé)
    if (user.status && user.status !== 'approved') {
      console.log('❌ User not approved');
      return null;
    }

    if (user.isActif === false) {
      console.log('❌ User inactive');
      return null;
    }

    if (!user.password) {
      console.log('❌ No password stored');
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    // If bcrypt comparison fails, check if password matches in plain text
    // This is for backward compatibility with old users who have plain text passwords
    let passwordValid = isMatch;
    if (!isMatch && user.password) {
      // Check if it's a plain text password (not a bcrypt hash)
      if (!user.password.startsWith('$2')) {
        passwordValid = password === user.password;
        
        // If plain text matches, automatically hash it for future use
        if (passwordValid) {
          const hashedPassword = await bcrypt.hash(password, 10);
          await this.usersService.updatePassword(user._id.toString(), hashedPassword);
          console.log('✅ Password migrated to hashed version');
        }
      }
    }

    if (!passwordValid) {
      console.log('❌ Password mismatch');
      return null;
    }

    // ✅ remove password safely
    const userObj = user.toObject ? user.toObject() : user;
    const { password: _removed, ...result } = userObj;

    return result;
  }

  // ✅ LOGIN
  async login(user: any) {
    const payload = {
      cin: user.cin,
      sub: user._id,
      roles: user.role ? [user.role] : [],
    };

    const userData = user.toObject ? user.toObject() : user;

    return {
      access_token: this.jwtService.sign(payload),
      id: userData._id,
      cin: userData.cin,
      lastName: userData.lastName,
      firstName: userData.firstName,
      role: userData.role || null,
    };
  }

  // ✅ REGISTER (corrigé avec hash sûr)
  async register(
    cin: string,
    password: string,
    firstName: string,
    lastName: string,
    role: string,
    email?: string,
    phoneNumber?: string,
    address?: string,
    companyName?: string,
  ) {
    const existingUser = await this.usersService.findByCin(cin);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // ✅ default role
    let roleId = role;
    if (!roleId) {
      const clientRole = await this.rolesService.findByName('client');
      if (!clientRole) {
        throw new BadRequestException(
          'Default client role not found. Please create a "client" role first.',
        );
      }
      roleId = clientRole._id.toString();
    }

    // ✅ IMPORTANT: hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const userData = {
      cin,
      password: hashedPassword,
      lastName,
      firstName,
      role: roleId,
      email,
      phoneNumber,
      address,
      companyName,
      status: 'pending',
      emailVerified: false,
      emailVerificationOtp: otp,
      otpExpiresAt,
      isActif: true,
    };

    const result = await this.usersService.create(userData);

    // ✅ send OTP email (non bloquant)
    if (result?.email) {
      try {
        await this.emailService.sendOTPEmail(
          result.email,
          result.firstName,
          otp,
        );
      } catch (e) {
        console.error('❌ OTP email failed:', e);
      }
    }

    return result;
  }

  // ✅ APPROVE USER
  async approveUser(userId: string, password: string, adminId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash the password if provided
    let hashedPassword = user.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await this.usersService.update(userId, {
      status: 'approved',
      approvedBy: adminId,
      approvedAt: new Date(),
      password: hashedPassword,
    });

    return updatedUser;
  }

  // ✅ VERIFY OTP
  async verifyOTP(cin: string, otp: string) {
    const user = await this.usersService.findByCin(cin);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerificationOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      throw new BadRequestException('OTP has expired');
    }

    // Update user as verified
    await this.usersService.update(user._id.toString(), {
      emailVerified: true,
      emailVerificationOtp: undefined,
      otpExpiresAt: undefined,
      status: 'approved',
    });

    return { message: 'Email verified successfully' };
  }

  // ✅ RESEND OTP
  async resendOTP(cin: string) {
    const user = await this.usersService.findByCin(cin);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersService.update(user._id.toString(), {
      emailVerificationOtp: otp,
      otpExpiresAt,
    });

    if (user.email) {
      try {
        await this.emailService.sendOTPEmail(user.email, user.firstName, otp);
      } catch (e) {
        console.error('❌ OTP email failed:', e);
      }
    }

    return { message: 'OTP sent successfully' };
  }

  // ✅ FORGOT PASSWORD
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset code will be sent' };
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.usersService.update(user._id.toString(), {
      passwordResetCode: resetCode,
      passwordResetCodeExpiresAt: resetCodeExpiresAt,
    });

    if (user.email) {
      try {
        await this.emailService.sendPasswordResetEmail(
          user.email,
          user.firstName,
          resetCode,
        );
      } catch (e) {
        console.error('❌ Password reset email failed:', e);
      }
    }

    return { message: 'If the email exists, a reset code will be sent' };
  }

  // ✅ RESET PASSWORD
  async resetPassword(email: string, resetCode: string, newPassword: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.passwordResetCode !== resetCode) {
      throw new BadRequestException('Invalid reset code');
    }

    if (
      user.passwordResetCodeExpiresAt &&
      new Date() > user.passwordResetCodeExpiresAt
    ) {
      throw new BadRequestException('Reset code has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersService.update(user._id.toString(), {
      password: hashedPassword,
      passwordResetCode: undefined,
      passwordResetCodeExpiresAt: undefined,
    });

    return { message: 'Password reset successfully' };
  }

  // ✅ RESEND RESET CODE
  async resendResetCode(email: string) {
    return this.forgotPassword(email);
  }
}