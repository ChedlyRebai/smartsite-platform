import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleController } from './google.controller';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailModule } from '../email/email.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'smartiste',
        signOptions: { expiresIn: '24h' },
      }),
    }),
    PassportModule,
    UsersModule,
    RolesModule,
    EmailModule,
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy, GoogleStrategy],
  controllers: [AuthController, GoogleController],
  exports: [AuthService],
})
export class AuthModule {}