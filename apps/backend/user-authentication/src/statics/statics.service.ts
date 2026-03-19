import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission } from '../permissions/entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class StaticsService {

    constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Role.name) private roleModel: Model<Role>,
    @InjectModel(Permission.name) private permissionModel: Model<Permission>,
  ) {}

  async getStats() {
    const [users, roles, permissions] = await Promise.all([
      this.userModel.countDocuments(),
      this.roleModel.countDocuments(),
      this.permissionModel.countDocuments(),
    ]);

    return {
      totalUsers: users,
      totalRoles: roles,
      totalPermissions: permissions,
    };
  }
}
