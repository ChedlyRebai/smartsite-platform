import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
<<<<<<< HEAD
import { RolesService } from '../roles/roles.service';
=======
import { EmailService } from '../email/email.service';
>>>>>>> 80efa83f (feat(auth): improve authentication flow and pending users management)
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) { }

  async validateUser(cin: string, password: string): Promise<any> {
    if (!cin || !password) {
      return null;
    }
    console.log("validate1", cin, "  ", password)
    const user = await this.usersService.findByCin(cin);
    console.log("before finding user", user)
    // L'utilisateur doit exister
    if (!user) {
      return null;
    }

    // Empêcher la connexion si l'utilisateur n'est pas approuvé
    if ((user as any).status && (user as any).status !== 'approved') {
      console.log("User not approved, status =", (user as any).status);
      return null;
    }

    // Utiliser le mot de passe stocké : priorité à motDePasse (défini lors de l'approbation),
    // sinon fallback sur password (ancien schéma / compat)
    const storedHash = (user as any).motDePasse || (user as any).password;
    if (!storedHash) {
      console.log("No stored password hash for user", cin);
      return null;
    }

    console.log("finding user", user)
    console.log("find by cin");
    if (await bcrypt.compare(password, storedHash)) {
      const userObj = user.toObject ? user.toObject() : user;
      const { password: _p, motDePasse: _m, ...result } = userObj as any;
      return result;
    }
    return null;
  }

  async login(user: any) {
<<<<<<< HEAD
    console.log("Login user:", user);
=======
    console.log("user::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::", user)
>>>>>>> 80efa83f (feat(auth): improve authentication flow and pending users management)
    const payload = {
      cin: user.cin,
      sub: user._id,
      roles: user.roles || [],
    };
    console.log("JWT Payload:", payload);
    
    const userData = user.toObject ? user.toObject() : user;
    
    return {
      access_token: this.jwtService.sign(payload),
<<<<<<< HEAD
      id: userData._id,
      cin: userData.cin,
      lastname: userData.lastname,
      firstname: userData.firstname,
      role: userData.role || null,
    };
  }

  async register(cin: string, password: string, firstname: string, lastname: string, role: string) {
=======

      id: user._id,
      cin: user.cin,
      lastname: user.lastname,
      firstname: user.firstname,
      role: user.role,

    };
  }

  async register(cin: string, password: string, firstname: string, lastname: string, role: string, email?: string, telephone?: string, departement?: string, address?: string) {
    console.log('🔍 DEBUG register appelé avec:', { cin, password, firstname, lastname, role, email, telephone, departement, address });

>>>>>>> 80efa83f (feat(auth): improve authentication flow and pending users management)
    const existingUser = await this.usersService.findByCin(cin);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

<<<<<<< HEAD
    // Look up the role by name to get the ObjectId
    let roleId;
    if (role) {
      const roleEntity = await this.rolesService.findByName(role);
      if (roleEntity) {
        roleId = roleEntity._id;
      } else {
        // If role not found, use a default role or throw error
        throw new Error(`Role "${role}" not found`);
      }
    } else {
      throw new Error('Role is required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    return this.usersService.create({
=======
    // Toujours créer les utilisateurs en statut pending pour approbation admin
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const userData = {
>>>>>>> 80efa83f (feat(auth): improve authentication flow and pending users management)
      cin,
      password: hashedPassword,
      lastname,
      firstname,
<<<<<<< HEAD
      role: roleId
=======
      role,
      email: email || address, // Utiliser email ou adresse comme fallback
      telephone,
      departement,
      address: address,
      status: 'pending' // Toujours en attente d'approbation
    };

    console.log('🔍 DEBUG userData à créer:', userData);

    const result = await this.usersService.create(userData);
    console.log('🔍 DEBUG utilisateur créé:', result);
    return result;
  }

  async approveUser(userId: string, password: string, adminId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== 'pending') {
      throw new BadRequestException('User is not in pending status');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await this.usersService.update(userId, {
      motDePasse: hashedPassword,
      status: 'approved',
      approvedBy: adminId,
      approvedAt: new Date(),
>>>>>>> 80efa83f (feat(auth): improve authentication flow and pending users management)
    });

    // Send approval email with credentials
    console.log('🔍 DEBUG: Vérification email pour utilisateur approuvé...');
    console.log('🔍 DEBUG: updatedUser:', updatedUser);
    console.log('🔍 DEBUG: updatedUser.email:', updatedUser?.email);

    if (updatedUser && updatedUser.email) {
      console.log('📧 ENVOI EMAIL: Envoi en cours à', updatedUser.email);
      try {
        await this.emailService.sendApprovalEmail(
          updatedUser.email,
          updatedUser.firstname,
          updatedUser.lastname,
          updatedUser.cin,
          password, // Send the plain password in email
        );
        console.log('✅ EMAIL ENVOYÉ avec succès à', updatedUser.email);
      } catch (error) {
        console.error('❌ Failed to send approval email:', error);
        // Don't throw here - user is already approved, just log the email error
      }
    } else {
      console.log('⚠️ PAS D\'EMAIL: Utilisateur sans adresse email');
    }

    return updatedUser;
  }
}
