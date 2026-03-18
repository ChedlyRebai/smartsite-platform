import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private emailService: EmailService,
    private rolesService: RolesService,
  ) {
  }

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

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).populate('role').exec();
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

  async getAllclients() {
    return await this.userModel.find().populate({
      path: 'role',
      match: { name: 'client' },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.passwordChnage = true;
    user.firstLogin = false;
    await user.save();
    return { message: 'Password changed successfully' };
  }

  async createUserWithTemporaryPassword(createUserDto: any): Promise<any> {
    const existingUser = await this.userModel
      .findOne({ cin: createUserDto.cin })
      .exec();
    if (existingUser) {
      throw new BadRequestException('User with this CIN already exists');
    }

    const temporaryPassword = this.generateTemporaryPassword();

    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    let roleId = createUserDto.role;
    if (!roleId) {
      const clientRole = await this.rolesService.findByName('client');
      if (!clientRole) {
        throw new BadRequestException(
          'Default client role not found. Please create a "client" role first.',
        );
      }
      roleId = clientRole._id.toString();
    }

    if (roleId && typeof roleId === 'string') {
      roleId = new Types.ObjectId(roleId);
    }

    // Prepare user data
    const userData = {
      cin: createUserDto.cin,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      email: createUserDto.email,
      telephone: createUserDto.telephone,
      address: createUserDto.address,
      companyName: createUserDto.companyName,
      departement: createUserDto.departement,
      changePassword: false,
      firstLogin: true,
      password: hashedPassword,
      role: roleId,
      status: 'approved', // Admin-created users are approved by default
      isActif: true,
      emailVerified: true, // Admin-created users emails are pre-verified
    };

    try {
      // Create the user
      const createdUser = new this.userModel(userData);
      const result = await createdUser.save();
      console.log('✅ User created successfully:', result._id);

      // Send email with temporary password
      if (result.email) {
        try {
          await this.emailService.sendTemporaryPasswordEmail(
            result.email,
            result.firstName,
            result.lastName,
            result.cin,
            temporaryPassword,
          );
          console.log(' Temporary password email sent to', result.email);
        } catch (error) {
          console.error(' Failed to send temporary password email:', error);
        }
      }

      const userObj = result.toObject ? result.toObject() : result;
      const { password, ...userWithoutPassword } = userObj;

      return {
        success: true,
        message: 'User created successfully. Temporary password sent to email.',
        user: userWithoutPassword,
      };
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Failed to create user');
    }
  }

  private generateTemporaryPassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';

    const allChars = uppercase + lowercase + numbers + special;
    let password = '';

    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    for (let i = password.length; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  // async changePassword(userId: string, currentPassword: string, newPassword: string) {
  //   const user = await this.userModel.findById(userId).exec();
    
  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }

  //   // Verify current password
  //   const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  //   if (!isPasswordValid) {
  //     throw new UnauthorizedException('Current password is incorrect');
  //   }

  //   // Hash new password
  //   const hashedPassword = await bcrypt.hash(newPassword, 10);
    
  //   // Update password
  //   user.password = hashedPassword;
  //   await user.save();

  //   return { message: 'Password changed successfully' };
  // }
}
