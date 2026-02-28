import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: any) {
    console.log(' DEBUG: createUserDto:', createUserDto);

    if (createUserDto.role && typeof createUserDto.role === 'string') {
      createUserDto.role = new Types.ObjectId(createUserDto.role);
    }

    try {
      const createdUser = new this.userModel(createUserDto);
      console.log(' DEBUG: createdUser avant save:', createdUser);

      const result = await createdUser.save();
      console.log(' DEBUG: Utilisateur créé:', result);
      console.log(' DEBUG: Utilisateur sauvegardé avec ID:', result._id);
      return result;
    } catch (error: any) {
      console.error('❌ ERREUR SAVE:', error.message);
      console.error('❌ ERREUR DETAILS:', error);
      throw error;
    }
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
      })
      .sort({ name: 1 })
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

  async findPending() {
    return this.userModel.find({ status: 'pending' }).populate('role').exec();
  }

  async update(id: string, updateUserDto: any) {
    return this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async handleBan(id: string) {
    const bannedUser = await this.userModel.findById(id).exec();
    if (!bannedUser) {
      throw new NotFoundException(`Usser with id ${id} not exist`);
    }
    bannedUser.isActif = !bannedUser.isActif;

    const user = await bannedUser.save();

    return user;
  }

  async getAllclients(){

    return await this.userModel.find().populate({
      path:"role",
      match: {name: 'client'}
    })
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userModel.findById(userId).exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    user.password = hashedPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }
}

