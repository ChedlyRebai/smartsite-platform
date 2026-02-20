import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private roleModel: Model<Role>) {}

  async create(createRoleDto: any) {
    const createdRole = new this.roleModel(createRoleDto);
    return createdRole.save();
  }

  async findAll() {
    return this.roleModel.find().populate('permissions').exec();
  }

  async findById(id: string) {
    return this.roleModel.findById(id).populate('permissions').exec();
  }

  async findByName(name: string) {
    return this.roleModel.findOne({ name }).populate('permissions').exec();
  }

  async update(id: string, updateRoleDto: any) {
    return this.roleModel.findByIdAndUpdate(id, updateRoleDto, { new: true }).populate('permissions').exec();
  }

  async remove(id: string) {
    return this.roleModel.findByIdAndDelete(id).exec();
  }

  async addPermissionToRole(roleId: string, permissionId: string) {
    return this.roleModel.findByIdAndUpdate(
      roleId,
      { $addToSet: { permissions: permissionId } },
      { new: true },
    ).populate('permissions').exec();
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    return this.roleModel.findByIdAndUpdate(
      roleId,
      { $pull: { permissions: permissionId } },
      { new: true },
    ).populate('permissions').exec();
  }
}
