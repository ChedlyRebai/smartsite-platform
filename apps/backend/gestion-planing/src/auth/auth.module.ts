import { Module } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy/jwt.strategy';
import { JwtGuard } from './jwt.guard/jwt.guard';

@Module({
  providers: [JwtStrategy, JwtGuard]
})
export class AuthModule {}
