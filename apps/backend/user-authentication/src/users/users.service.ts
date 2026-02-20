import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: any) {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findByCin(cin: string) {
<<<<<<< HEAD
    return this.userModel.findOne({ cin }).populate('roles').exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).populate('roles').exec();
  }

  async findAll() {
    return this.userModel.find().populate('roles').exec();
=======
    return this.userModel.findOne({ cin }).populate('role').exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).populate('role').exec();
  }

  async findAll() {
    return this.userModel.find().populate('role').exec();
>>>>>>> origin/main
  }

  async update(id: string, updateUserDto: any) {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
  }

  async remove(id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }
}
