import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './entities/user.entity';
import { Role, RoleSchema } from 'src/roles/entities/role.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema },

        { name: Role.name, schema: RoleSchema },
    ]),
    JwtModule.register({
      secret: 'smartiste',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
