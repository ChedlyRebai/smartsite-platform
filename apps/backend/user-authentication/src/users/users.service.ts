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
  ) {}

  // ✅ CREATE USER (CORRIGÉ AVEC HASH PASSWORD)
  async create(createUserDto: any) {
    console.log(' DEBUG: createUserDto:', createUserDto);

    // Handle role - accept either role ID or role name
    if (createUserDto.role && typeof createUserDto.role === 'string') {
      // Check if it's a valid ObjectId (24 hex characters)
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(createUserDto.role);
      
      if (isValidObjectId) {
        // It's a valid ObjectId, use it directly
        createUserDto.role = new Types.ObjectId(createUserDto.role);
      } else {
        // It's likely a role name, try to find the role
        try {
          const role = await this.rolesService.findByName(createUserDto.role);
          if (role) {
            createUserDto.role = role._id;
          } else {
            // Role not found by name, try to find "client" as default
            const defaultRole = await this.rolesService.findByName('client');
            if (defaultRole) {
              createUserDto.role = defaultRole._id;
            } else {
              throw new BadRequestException('Invalid role. Please provide a valid role ID or create roles first.');
            }
          }
        } catch (err) {
          console.log('Role lookup failed, using default');
        }
      }
    }

    // ✅ HASH PASSWORD
    if (createUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      createUserDto.password = await bcrypt.hash(
        createUserDto.password,
        salt,
      );
    }

    try {
      const createdUser = new this.userModel(createUserDto);
      console.log(' DEBUG: createdUser avant save:', createdUser);

      const result = await createdUser.save();
      console.log(' DEBUG: Utilisateur créé:', result);
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

    if (!user) return { error: 'User not found' };
    if (!user.role) return { error: 'Role not found' };

    const role = user.role as any;
    return { permissions: role.permissions || [] };
  }

  async findByCin(cin: string) {
    return this.userModel.findOne({ cin }).populate('role').exec();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).populate('role').exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).populate('role').exec();
  }

  async findAll() {
    try {
      return await this.userModel.find().populate('role').exec();
    } catch (error) {
      console.error('Error in findAll:', error);
      // If populate fails, return users without populated role
      return this.userModel.find().select('-password').exec();
    }
  }

  async findPending() {
    return this.userModel.find({ status: 'pending' }).populate('role').exec();
  }

  async update(id: string, updateUserDto: any) {
    // ⚠️ hash si password modifié
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        salt,
      );
    }

    return this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  // Update password directly (used for password migration)
  async updatePassword(id: string, newPassword: string) {
    return this.userModel
      .findByIdAndUpdate(id, { password: newPassword }, { new: true })
      .exec();
  }

  async handleBan(id: string) {
    const bannedUser = await this.userModel.findById(id).exec();
    if (!bannedUser) {
      throw new NotFoundException(`User with id ${id} not exist`);
    }

    bannedUser.isActif = !bannedUser.isActif;
    return await bannedUser.save();
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
    if (!user) throw new NotFoundException('User not found');

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
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

    const userData = {
      ...createUserDto,
      password: hashedPassword,
      role: roleId,
      status: 'approved',
      isActif: true,
      emailVerified: true,
    };

    const createdUser = new this.userModel(userData);
    const result = await createdUser.save();

    if (result.email) {
      try {
        await this.emailService.sendTemporaryPasswordEmail(
          result.email,
          result.firstName,
          result.lastName,
          result.cin,
          temporaryPassword,
        );
      } catch (error) {
        console.error(' Failed to send email:', error);
      }
    }

    const userObj = result.toObject ? result.toObject() : result;
    const { password, ...userWithoutPassword } = userObj;

    return {
      success: true,
      message: 'User created successfully. Temporary password sent to email.',
      user: userWithoutPassword,
    };
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

  // ============ TEAM ASSIGNMENT METHODS ============

  /**
   * Assign a manager to a user (team member)
   */
  async assignManager(userId: string, managerId: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const manager = await this.userModel.findById(managerId).exec();
    if (!manager) {
      throw new NotFoundException('Gestionnaire non trouvé');
    }

    // Update user's manager
    user.manager = new Types.ObjectId(managerId);
    await user.save();

    return {
      message: 'Gestionnaire affecté avec succès',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        manager: manager._id,
        managerName: `${manager.firstName} ${manager.lastName}`
      }
    };
  }

  /**
   * Modify a user's manager
   */
  async modifyManager(userId: string, newManagerId: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const newManager = await this.userModel.findById(newManagerId).exec();
    if (!newManager) {
      throw new NotFoundException('Nouveau gestionnaire non trouvé');
    }

    user.manager = new Types.ObjectId(newManagerId);
    await user.save();

    return {
      message: 'Gestionnaire modifié avec succès',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        manager: newManager._id,
        managerName: `${newManager.firstName} ${newManager.lastName}`
      }
    };
  }

  /**
   * View a user's manager
   */
  async getManager(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId)
      .populate('manager', 'firstName lastName email cin phoneNumber')
      .exec();

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (!user.manager) {
      return { message: 'Aucun gestionnaire affecté', manager: null };
    }

    return {
      manager: user.manager
    };
  }

  /**
   * Set responsibilities for a user
   */
  async setResponsibilities(userId: string, responsibilities: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    user.responsibilities = responsibilities;
    await user.save();

    return {
      message: 'Responsabilités mises à jour avec succès',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        responsibilities: user.responsibilities
      }
    };
  }

  /**
   * Get users by site (team members assigned to a site)
   */
  async getUsersBySite(siteId: string): Promise<any[]> {
    return this.userModel.find({ assignedSite: new Types.ObjectId(siteId) })
      .populate('manager', 'firstName lastName email')
      .populate('role', 'name')
      .exec();
  }

  /**
   * Assign user to a site
   */
  async assignToSite(userId: string, siteId: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    user.assignedSite = new Types.ObjectId(siteId);
    await user.save();

    return {
      message: 'Utilisateur affecté au site avec succès',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        assignedSite: user.assignedSite
      }
    };
  }

  /**
   * Remove user from a site
   */
  async removeFromSite(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    user.assignedSite = undefined;
    await user.save();

    return {
      message: 'Utilisateur retiré du site avec succès',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        assignedSite: null
      }
    };
  }
}