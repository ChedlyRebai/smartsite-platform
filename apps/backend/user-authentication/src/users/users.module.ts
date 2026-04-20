import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './entities/user.entity';

import { Role, RoleSchema } from '../roles/entities/role.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { EmailModule } from '../email/email.module';
import { RolesModule } from '../roles/roles.module';
import { SuperAdminSeedService } from '../bootstrap/super-admin.seed.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },

      { name: Role.name, schema: RoleSchema },
    ]),
    JwtModule.register({
      secret: 'smartsite',
      signOptions: { expiresIn: '24h' },
    }),
    AuditLogsModule,
    EmailModule,
    RolesModule,
  ],
  providers: [UsersService, SuperAdminSeedService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
