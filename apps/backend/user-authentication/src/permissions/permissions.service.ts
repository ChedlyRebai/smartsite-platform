import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(@InjectModel(Permission.name) private permissionModel: Model<Permission>) {}

  private toModuleLabel(rawValue?: string): string {
    const normalized = String(rawValue || '')
      .trim()
      .replace(/^\/+/, '')
      .replace(/[\-_]+/g, ' ')
      .replace(/\s+/g, ' ');

    if (!normalized) {
      return 'General';
    }

    return normalized
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private normalizeModule(moduleValue?: string, hrefValue?: string): string {
    if (moduleValue && moduleValue.trim().length > 0) {
      return this.toModuleLabel(moduleValue);
    }

    const cleanedHref = (hrefValue || '').trim().replace(/^\/+/, '');
    if (!cleanedHref) {
      return 'General';
    }

    const firstSegment = cleanedHref.split('/')[0] || 'general';
    return this.toModuleLabel(firstSegment);
  }

  async create(createPermissionDto: any) {
    try {
      // Check if permission with same name already exists
      const existing = await this.permissionModel.findOne({ name: createPermissionDto.name }).exec();
      if (existing) {
        throw new Error(`Permission with name "${createPermissionDto.name}" already exists`);
      }

      createPermissionDto.module = this.normalizeModule(
        createPermissionDto.module,
        createPermissionDto.href,
      );

      const createdPermission = new this.permissionModel(createPermissionDto);
      return await createdPermission.save();
    } catch (error: any) {
      if (error.code === 11000 || error.message?.includes('already exists')) {
        throw new Error(`Permission with name "${createPermissionDto.name}" already exists`);
      }
      console.error('Error in permissionsService.create:', error);
      throw error;
    }
  }

  // async getNvigationAccess(userId:string){
  //   const navigationItems=await this.permissionModel.find({ users: userId }).exec();
  //   return navigationItems;
  // }

  async findAll() {
    return this.permissionModel.find().sort({ module: 1, name: 1 }).exec();
  }

  async findById(id: string) {
    return this.permissionModel.findById(id).exec();
  }

  async findByName(name: string) {
    return this.permissionModel.findOne({ name }).exec();
  }

  async update(id: string, updatePermissionDto: any) {
    updatePermissionDto.module = this.normalizeModule(
      updatePermissionDto.module,
      updatePermissionDto.href,
    );

    return this.permissionModel.findByIdAndUpdate(id, updatePermissionDto, { new: true }).exec();
  }

  async remove(id: string) {
    return this.permissionModel.findByIdAndDelete(id).exec();
  }
}
