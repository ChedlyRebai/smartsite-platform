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
      { name: 'sites', href: '/sites', access: true, create: true, update: true, delete: true, description: 'Sites management' },
      { name: 'sites-detail', href: '/sites-detail', access: true, create: true, update: true, delete: true, description: 'Sites detail management' },
      { name: 'my-sites', href: '/my-sites', access: true, create: false, update: false, delete: false, description: 'My sites view' },
      { name: 'my-affected-sites', href: '/my-affected-sites', access: true, create: false, update: false, delete: false, description: 'My affected sites view' },
    ];

    try {
      for (const perm of defaultPermissions) {
        const exists = await this.permissionModel.findOne({ name: perm.name }).exec();
        if (!exists) {
          await this.permissionModel.create(perm);
          this.logger.log(`Created permission: ${perm.name}`);
        }
      }

      // Assign permissions to roles
      const roles = await this.roleModel.find().exec();
      
      // Super admin - all permissions
      const superAdminRole = roles.find(r => r.name === 'super_admin');
      if (superAdminRole) {
        const allPerms = await this.permissionModel.find().select('_id').exec();
        await this.roleModel.findByIdAndUpdate(superAdminRole._id, { permissions: allPerms.map(p => p._id) });
        this.logger.log(`Assigned ${allPerms.length} permissions to super_admin role`);
      }

      // Director - all permissions
      const directorRole = roles.find(r => r.name === 'director');
      if (directorRole) {
        const allPerms = await this.permissionModel.find().select('_id').exec();
        await this.roleModel.findByIdAndUpdate(directorRole._id, { permissions: allPerms.map(p => p._id) });
        this.logger.log(`Assigned ${allPerms.length} permissions to director role`);
      }

      // Project manager - sites, projects, planning, etc.
      const projectManagerRole = roles.find(r => r.name === 'project_manager');
      if (projectManagerRole) {
        const projectManagerPerms = await this.permissionModel.find({
          name: { $in: ['dashboard', 'projects', 'planning', 'my-task', 'sites', 'sites-detail', 'my-sites', 'my-affected-sites', 'team', 'my-team-members', 'clients', 'materials', 'finance', 'payments', 'reports', 'notifications', 'map'] }
        }).select('_id').exec();
        await this.roleModel.findByIdAndUpdate(projectManagerRole._id, { permissions: projectManagerPerms.map(p => p._id) });
        this.logger.log(`Assigned ${projectManagerPerms.length} permissions to project_manager role`);
      }

      // Site manager - sites, team, materials
      const siteManagerRole = roles.find(r => r.name === 'site_manager');
      if (siteManagerRole) {
        const siteManagerPerms = await this.permissionModel.find({
          name: { $in: ['dashboard', 'sites', 'sites-detail', 'my-sites', 'my-affected-sites', 'team', 'my-team-members', 'materials', 'reports', 'notifications'] }
        }).select('_id').exec();
        await this.roleModel.findByIdAndUpdate(siteManagerRole._id, { permissions: siteManagerPerms.map(p => p._id) });
        this.logger.log(`Assigned ${siteManagerPerms.length} permissions to site_manager role`);
      }

      // Works manager - sites, planning, materials
      const worksManagerRole = roles.find(r => r.name === 'works_manager');
      if (worksManagerRole) {
        const worksManagerPerms = await this.permissionModel.find({
          name: { $in: ['dashboard', 'sites', 'sites-detail', 'my-sites', 'my-affected-sites', 'planning', 'my-task', 'materials', 'reports', 'notifications'] }
        }).select('_id').exec();
        await this.roleModel.findByIdAndUpdate(worksManagerRole._id, { permissions: worksManagerPerms.map(p => p._id) });
        this.logger.log(`Assigned ${worksManagerPerms.length} permissions to works_manager role`);
      }

      // QHSE manager - sites, qhse, incidents
      const qhseManagerRole = roles.find(r => r.name === 'qhse_manager');
      if (qhseManagerRole) {
        const qhseManagerPerms = await this.permissionModel.find({
          name: { $in: ['dashboard', 'sites', 'sites-detail', 'my-sites', 'my-affected-sites', 'qhse', 'incidents', 'reports', 'notifications'] }
        }).select('_id').exec();
        await this.roleModel.findByIdAndUpdate(qhseManagerRole._id, { permissions: qhseManagerPerms.map(p => p._id) });
        this.logger.log(`Assigned ${qhseManagerPerms.length} permissions to qhse_manager role`);
      }

      // Accountant - finance, clients
      const accountantRole = roles.find(r => r.name === 'accountant');
      if (accountantRole) {
        const accountantPerms = await this.permissionModel.find({
          name: { $in: ['dashboard', 'finance', 'payments', 'clients', 'reports', 'notifications'] }
        }).select('_id').exec();
        await this.roleModel.findByIdAndUpdate(accountantRole._id, { permissions: accountantPerms.map(p => p._id) });
        this.logger.log(`Assigned ${accountantPerms.length} permissions to accountant role`);
      }

      // Client - sites, reports
      const clientRole = roles.find(r => r.name === 'client');
      if (clientRole) {
        const clientPerms = await this.permissionModel.find({
          name: { $in: ['dashboard', 'sites', 'sites-detail', 'my-sites', 'reports', 'notifications'] }
        }).select('_id').exec();
        await this.roleModel.findByIdAndUpdate(clientRole._id, { permissions: clientPerms.map(p => p._id) });
        this.logger.log(`Assigned ${clientPerms.length} permissions to client role`);
      }
    } catch (e) {
      this.logger.error(`Permission seed failed: ${e instanceof Error ? e.message : e}`);
    }
  }
}