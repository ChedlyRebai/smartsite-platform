import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from 'src/roles/entities/role.entity';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel('Role') private Role: Model<Role>,
  ) {}

  async create(createUserDto: any) {
    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel(createUserDto);

    return createdUser.save();
  }

  async mypermission(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'role',
        populate: {
          path: 'permissions',
          match: { access: true },
        },
      }).sort({name:1})
      .exec();

    if (!user) {
      return { error: 'User not found' };
    }

    if (!user.role) {
      return { error: 'Role not found' };
    }

    const role = user.role as any;
    return { permissions: role.permissions || [] };
  }

  async findByCin(cin: string) {
    console.log('from user service', cin);
    return this.userModel.findOne({ cin }).populate('role').exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).populate('role').exec();
  }

  async findAll() {
    return this.userModel.find().populate('role').exec();
  }

  async update(id: string, updateUserDto: any) {
    return this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }
}
