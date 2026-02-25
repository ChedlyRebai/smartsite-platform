import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { StaticsModule } from './statics/statics.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    StaticsModule,
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsite',
    ),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
