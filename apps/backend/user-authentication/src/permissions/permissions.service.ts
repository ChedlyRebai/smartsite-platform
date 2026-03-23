import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(@InjectModel(Permission.name) private permissionModel: Model<Permission>) {}

  async create(createPermissionDto: any) {
    const createdPermission = new this.permissionModel(createPermissionDto);
    return createdPermission.save();
  }

  // async getNvigationAccess(userId:string){
  //   const navigationItems=await this.permissionModel.find({ users: userId }).exec();
  //   return navigationItems;
  // }

  async findAll() {
    return this.permissionModel.find().exec();
  }

  async findById(id: string) {
    return this.permissionModel.findById(id).exec();
  }

  async findByName(name: string) {
    return this.permissionModel.findOne({ name }).exec();
  }

  async update(id: string, updatePermissionDto: any) {
    return this.permissionModel.findByIdAndUpdate(id, updatePermissionDto, { new: true }).exec();
  }

  async remove(id: string) {
    return this.permissionModel.findByIdAndDelete(id).exec();
  }
}
