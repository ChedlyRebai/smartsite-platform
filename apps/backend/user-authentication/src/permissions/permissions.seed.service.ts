import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission } from './entities/permission.entity';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class PermissionsSeedService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsSeedService.name);

  constructor(
    @InjectModel(Permission.name) private permissionModel: Model<Permission>,
    @InjectModel(Role.name) private roleModel: Model<Role>,
  ) {}

  async onModuleInit(): Promise<void> {
    const defaultPermissions = [
      { name: 'dashboard', href: '/dashboard', access: true, create: true, update: true, delete: true, description: 'Dashboard access' },
      { name: 'users', href: '/users', access: true, create: true, update: true, delete: true, description: 'Users management' },
      { name: 'roles', href: '/roles', access: true, create: true, update: true, delete: true, description: 'Roles management' },
      { name: 'permissions', href: '/permissions', access: true, create: true, update: true, delete: true, description: 'Permissions management' },
      { name: 'projects', href: '/projects', access: true, create: true, update: true, delete: true, description: 'Projects management' },
      { name: 'teams', href: '/teams', access: true, create: true, update: true, delete: true, description: 'Teams management' },
      { name: 'suppliers', href: '/suppliers', access: true, create: true, update: true, delete: true, description: 'Suppliers management' },
      { name: 'supplier-detail', href: '/suppliers/:id', access: true, create: false, update: false, delete: false, description: 'Supplier detail view' },
      { name: 'edit-supplier', href: '/suppliers/:id/edit', access: true, create: false, update: true, delete: false, description: 'Edit supplier' },
      { name: 'catalog', href: '/catalog', access: true, create: true, update: true, delete: true, description: 'Catalog management' },
      { name: 'chatbot', href: '/chatbot', access: true, create: true, update: true, delete: true, description: 'Chatbot access' },
      { name: 'statics', href: '/statics', access: true, create: true, update: true, delete: true, description: 'Statistics access' },
      { name: 'audit-logs', href: '/audit-logs', access: true, create: false, update: false, delete: false, description: 'Audit logs view' },
      { name: 'settings', href: '/settings', access: true, create: true, update: true, delete: false, description: 'Settings management' },
    ];

    try {
      for (const perm of defaultPermissions) {
        const exists = await this.permissionModel.findOne({ name: perm.name }).exec();
        if (!exists) {
          await this.permissionModel.create(perm);
          this.logger.log(`Created permission: ${perm.name}`);
        }
      }

      const role = await this.roleModel.findOne({ name: 'super_admin' }).exec();
      if (role) {
        const perms = await this.permissionModel.find().select('_id').exec();
        const permIds = perms.map((p) => p._id);
        await this.roleModel.findByIdAndUpdate(role._id, { permissions: permIds });
        this.logger.log(`Assigned ${permIds.length} permissions to super_admin role`);
      }
    } catch (e) {
      this.logger.error(`Permission seed failed: ${e instanceof Error ? e.message : e}`);
    }
  }
}