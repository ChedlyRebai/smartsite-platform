import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
<<<<<<< HEAD
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
=======
import { Types } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  async create(createUserDto: any) {
    console.log(' DEBUG: createUserDto:', createUserDto);

    // Convertir le role en ObjectId si nécessaire
    if (createUserDto.role && typeof createUserDto.role === 'string') {
      createUserDto.role = new Types.ObjectId(createUserDto.role);
    }

    // Ne PAS hasher le mot de passe ici - il est déjà hashé dans auth.service
    // Le hashage est fait dans auth.service.ts

    try {
      const createdUser = new this.userModel(createUserDto);
      console.log(' DEBUG: createdUser avant save:', createdUser);

      const result = await createdUser.save();
      console.log(' DEBUG: Utilisateur créé:', result);
      console.log(' DEBUG: Utilisateur sauvegardé avec ID:', result._id);
      return result;
    } catch (error) {
      console.error('❌ ERREUR SAVE:', error.message);
      console.error('❌ ERREUR DETAILS:', error);
      throw error;
    }
>>>>>>> 80efa83f (feat(auth): improve authentication flow and pending users management)
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
<<<<<<< HEAD
    console.log('from user service', cin);
    return await this.userModel.findOne({ cin }).populate('role').exec();
=======
    console.log("from user service", cin)
    return this.userModel.findOne({ cin }).populate('role').exec();
>>>>>>> 80efa83f (feat(auth): improve authentication flow and pending users management)
  }

  async findById(id: string) {
    return this.userModel.findById(id).populate('role').exec();
  }

  async findAll() {
    return await this.userModel.find().populate('role').exec();
  }

  async findPending() {
    return this.userModel.find({ status: 'pending' }).populate('role').exec();
  }

  async update(id: string, updateUserDto: any) {
    return await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    return await this.userModel.findByIdAndDelete(id).exec();
  }

  async handleBan(id: string) {
    const bannedUser = await this.userModel.findById(id).exec();
    if (!bannedUser) {
      throw new NotFoundException(`Usser with id ${id} not exist`);
    }
    if (bannedUser?.estActif) {
      bannedUser.estActif = false;
    } else {
      bannedUser.estActif = true;
    }

    const user = await bannedUser.save();

    return user;
  }
}
