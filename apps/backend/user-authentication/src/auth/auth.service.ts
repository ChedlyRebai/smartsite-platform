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

  async validateUser(cin: string, password: string): Promise<any> {
    if (!cin || !password) {
      return null;
    }
    console.log('validate1', cin, '  ', password);
    const user = await this.usersService.findByCin(cin);
    console.log('before finding user', user);
    if (!user) {
      return null;
    }

    const storedHash = (user as any).password || (user as any).password;
    if (!storedHash) {
      console.log('No stored password hash for user', cin);
      return null;
    }

    console.log('finding user', user);
    console.log('find by cin');
    if (await bcrypt.compare(password, storedHash)) {
      const userObj = user.toObject ? user.toObject() : user;
      const { password: _p, password: _m, ...result } = userObj as any;
      return result;
    }
    return null;
  }

  async login(user: any) {
    console.log('Login user:', user);
    const payload = {
      cin: user.cin,
      sub: user._id,
      roles: user.roles || [],
    };
    console.log('JWT Payload:', payload);

    const userData = user.toObject ? user.toObject() : user;

    return {
      access_token: this.jwtService.sign(payload),
      id: userData._id,
      cin: userData.cin,
      lastName: userData.lastName,
      firstName: userData.firstName,
      role: userData.role || null,
      firstLogin: userData.firstLogin || false,
    };
  }

  async register(
    cin: string,
    password: string,
    firstName: string,
    lastName: string,
    role: string,
    email?: string,
    telephone?: string,

    address?: string,
    companyName?: string,
  ) {
    console.log('🔍 DEBUG register appelé avec:', {
      cin,
      password,
      firstName,
      lastName,
      role,
      email,
      telephone,

      address,
      companyName,
    });

    const existingUser = await this.usersService.findByCin(cin);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

<<<<<<< HEAD

=======
>>>>>>> c80e20e5 (feat: implement OTP verification and resend functionality in authentication flow)
    // Find default "client" role if no role provided
    let roleId = role;
    if (!roleId) {
      const clientRole = await this.rolesService.findByName('client');
      if (!clientRole) {
<<<<<<< HEAD
        throw new BadRequestException(
          'Default client role not found. Please create a "client" role first.',
        );
=======
        throw new BadRequestException('Default client role not found. Please create a "client" role first.');
>>>>>>> c80e20e5 (feat: implement OTP verification and resend functionality in authentication flow)
      }
      roleId = clientRole._id.toString();
      console.log('🔍 DEBUG: Using default client role:', roleId);
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    const userData = {
      cin,
      password: hashedPassword,
      lastName,
      firstName,
      role: roleId,
      email: email || address,
      telephone,

      address: address,
      status: 'pending',
      companyName,
      emailVerified: false,
      emailVerificationOtp: otp,
      otpExpiresAt: otpExpiresAt,
    };

    console.log('🔍 DEBUG userData à créer:', userData);

    const result = await this.usersService.create(userData);
    console.log('🔍 DEBUG utilisateur créé:', result);

    // Send OTP email
    if (result && result.email) {
      try {
        await this.emailService.sendOTPEmail(
          result.email,
          result.firstName,
          otp,
        );
        console.log('✅ OTP envoyé avec succès à', result.email);
      } catch (error) {
<<<<<<< HEAD
        console.error("❌ Erreur lors de l'envoi de l'OTP:", error);
=======
        console.error('❌ Erreur lors de l\'envoi de l\'OTP:', error);
>>>>>>> c80e20e5 (feat: implement OTP verification and resend functionality in authentication flow)
        // Don't fail registration if email sending fails
      }
    }

    return result;
  }

  async verifyOTP(cin: string, otp: string) {
    const user = await this.usersService.findByCin(cin);
<<<<<<< HEAD

=======
    
>>>>>>> c80e20e5 (feat: implement OTP verification and resend functionality in authentication flow)
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (!user.emailVerificationOtp) {
      throw new BadRequestException('No OTP found for this user');
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      throw new BadRequestException('OTP has expired');
    }

    if (user.emailVerificationOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Update user to mark email as verified
    const updatedUser = await this.usersService.update(user._id.toString(), {
      emailVerified: true,
      emailVerificationOtp: null,
      otpExpiresAt: null,
    });

    if (!updatedUser) {
      throw new BadRequestException('Failed to update user');
    }

    console.log('✅ Email verified for user:', user.cin);
    return {
      success: true,
      message: 'Email verified successfully',
      user: {
        id: updatedUser._id,
        cin: updatedUser.cin,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        emailVerified: updatedUser.emailVerified,
      },
    };
  }

  async resendOTP(cin: string) {
    const user = await this.usersService.findByCin(cin);
<<<<<<< HEAD

=======
    
>>>>>>> c80e20e5 (feat: implement OTP verification and resend functionality in authentication flow)
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Update user with new OTP
    await this.usersService.update(user._id.toString(), {
      emailVerificationOtp: otp,
      otpExpiresAt: otpExpiresAt,
    });

    // Send OTP email
    if (user.email) {
      try {
<<<<<<< HEAD
        await this.emailService.sendOTPEmail(user.email, user.firstName, otp);
        console.log('✅ OTP renvoyé avec succès à', user.email);
      } catch (error) {
        console.error("❌ Erreur lors du renvoi de l'OTP:", error);
=======
        await this.emailService.sendOTPEmail(
          user.email,
          user.firstName,
          otp,
        );
        console.log('✅ OTP renvoyé avec succès à', user.email);
      } catch (error) {
        console.error('❌ Erreur lors du renvoi de l\'OTP:', error);
>>>>>>> c80e20e5 (feat: implement OTP verification and resend functionality in authentication flow)
        throw new BadRequestException('Failed to send OTP email');
      }
    } else {
      throw new BadRequestException('No email found for this user');
    }

    return {
      success: true,
      message: 'OTP sent successfully',
    };
  }

  async approveUser(userId: string, password: string, adminId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== 'pending') {
      throw new BadRequestException('User is not in pending status');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await this.usersService.update(userId, {
      password: hashedPassword,
      status: 'approved',
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    console.log('🔍 DEBUG: Vérification email pour utilisateur approuvé...');
    console.log('🔍 DEBUG: updatedUser:', updatedUser);
    console.log('🔍 DEBUG: updatedUser.email:', updatedUser?.email);

    if (updatedUser && updatedUser.email) {
      console.log('📧 ENVOI EMAIL: Envoi en cours à', updatedUser.email);
      try {
        await this.emailService.sendApprovalEmail(
          updatedUser.email,
          updatedUser.firstName,
          updatedUser.lastName,
          updatedUser.cin,
          password,
        );
        console.log('✅ EMAIL ENVOYÉ avec succès à', updatedUser.email);
      } catch (error) {
        console.error('❌ Failed to send approval email:', error);
      }
    } else {
      console.log("⚠️ PAS D'EMAIL: Utilisateur sans adresse email");
    }

    return updatedUser;
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // Valid for 15 minutes

    // Update user with reset code
    await this.usersService.update(user._id.toString(), {
      passwordResetCode: resetCode,
      passwordResetCodeExpiresAt: resetCodeExpiresAt,
    });

    // Send reset code email
    if (user.email) {
      try {
        await this.emailService.sendPasswordResetEmail(
          user.email,
          user.firstName,
          resetCode,
        );
        console.log('✅ Reset code sent to', user.email);
      } catch (error) {
        console.error('❌ Failed to send reset code email:', error);
        throw new BadRequestException('Failed to send reset code email');
      }
    }

    return {
      success: true,
      message: 'Reset code sent to your email',
    };
  }

  async resetPassword(email: string, resetCode: string, newPassword: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordResetCode) {
      throw new BadRequestException('No reset code found for this user');
    }

    if (user.passwordResetCodeExpiresAt && new Date() > user.passwordResetCodeExpiresAt) {
      throw new BadRequestException('Reset code has expired');
    }

    if (user.passwordResetCode !== resetCode) {
      throw new BadRequestException('Invalid reset code');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset code
    const updatedUser = await this.usersService.update(user._id.toString(), {
      password: hashedPassword,
      passwordResetCode: null,
      passwordResetCodeExpiresAt: null,
    });

    if (!updatedUser) {
      throw new BadRequestException('Failed to reset password');
    }

    console.log('✅ Password reset for user:', user.cin);
    return {
      success: true,
      message: 'Password reset successfully',
    };
  }

  async resendResetCode(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate new reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Update user with new reset code
    await this.usersService.update(user._id.toString(), {
      passwordResetCode: resetCode,
      passwordResetCodeExpiresAt: resetCodeExpiresAt,
    });

    // Send reset code email
    if (user.email) {
      try {
        await this.emailService.sendPasswordResetEmail(
          user.email,
          user.firstName,
          resetCode,
        );
        console.log('✅ Reset code resent to', user.email);
      } catch (error) {
        console.error('❌ Failed to resend reset code email:', error);
        throw new BadRequestException('Failed to send reset code email');
      }
    }

    return {
      success: true,
      message: 'Reset code sent to your email',
    };
  }
}
