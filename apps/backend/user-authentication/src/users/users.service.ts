import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: any) {
    // Hash password if it's in plain text
    if (
      createUserDto.motDePasse &&
      !createUserDto.motDePasse.startsWith('$2')
    ) {
      createUserDto.motDePasse = await bcrypt.hash(
        createUserDto.motDePasse,
        10,
      );
    }
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findByCin(cin: string) {
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
