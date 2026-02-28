import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';

import { LocalStrategy } from './strategies/local.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    JwtModule.register({
      secret: 'smartiste',
      signOptions: { expiresIn: '24h' },
    }),
    PassportModule,
    UsersModule,
<<<<<<< HEAD
    RolesModule,
=======
    EmailModule,
>>>>>>> 80efa83f (feat(auth): improve authentication flow and pending users management)
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule { }
