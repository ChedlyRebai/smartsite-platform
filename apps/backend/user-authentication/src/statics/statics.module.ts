import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Permission,
  PermissionSchema,
} from '../permissions/entities/permission.entity';
import { Role, RoleSchema } from '../roles/entities/role.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { StaticsController } from './statics.controller';
import { StaticsService } from './statics.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema },
    ]),
  ],
  controllers: [StaticsController],
  providers: [StaticsService],
})
export class StaticsModule {}
