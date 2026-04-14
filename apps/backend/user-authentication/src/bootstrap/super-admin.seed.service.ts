import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RolesService } from '../roles/roles.service';
import { upsertStreamUser } from '../lib/stream';

/**
 * À chaque démarrage : assure qu’un rôle super_admin existe et qu’un compte super-admin
 * est présent, approuvé (status) et actif (isActif), pour pouvoir toujours se connecter.
 */
@Injectable()
export class SuperAdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(SuperAdminSeedService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly rolesService: RolesService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabled = this.config.get<string>('SUPER_ADMIN_SEED', 'true');
    if (enabled === 'false') {
      this.logger.log('SUPER_ADMIN_SEED=false — seed super admin désactivé.');
      return;
    }

    try {
      let role = await this.rolesService.findByName('super_admin');
      if (!role) {
        await this.rolesService.create({
          name: 'super_admin',
          description: 'Administrateur système',
        });
        role = await this.rolesService.findByName('super_admin');
      }
      if (!role) {
        this.logger.error(
          'Impossible de créer ou trouver le rôle super_admin — abandon du seed.',
        );
        return;
      }

      const cin =
        this.config.get<string>('SUPER_ADMIN_CIN')?.trim() || '00000001';
      const email =
        this.config.get<string>('SUPER_ADMIN_EMAIL')?.trim() ||
        'superadmin@smartsite.local';
      const plainPassword =
        this.config.get<string>('SUPER_ADMIN_PASSWORD') || 'Admin@2024!';
      const forcePassword =
        this.config.get<string>('SUPER_ADMIN_FORCE_PASSWORD') === 'true';

      const existing = await this.userModel.findOne({ cin }).exec();

      if (existing) {
        const update: Record<string, unknown> = {
          role: role._id,
          status: 'approved',
          isActif: true,
          emailVerified: true,
        };
        if (forcePassword) {
          update.password = await bcrypt.hash(plainPassword, 10);
        }
        await this.userModel.updateOne({ cin }, { $set: update }).exec();
        this.logger.log(
          `Compte super admin (CIN ${cin}) synchronisé : approuvé, actif, rôle super_admin.`,
        );
        return;
      }

      const hashed = await bcrypt.hash(plainPassword, 10);
      const newUser: any = await this.userModel.create({
        cin,
        firstName: 'Super',
        lastName: 'Admin',
        email,
        password: hashed,
        role: role._id,
        status: 'approved',
        isActif: true,
        emailVerified: true,
        address: '—',
        firstLogin: false,
      });

      newUser.fullName =
        newUser.fullName || `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim();
      newUser.profilePic = newUser.profilePic || newUser.profilePicture || '';
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });

      this.logger.log(
        `Compte super admin créé — CIN: ${cin} | email: ${email}`,
      );
      if (this.config.get('NODE_ENV') !== 'production') {
        this.logger.warn(
          'Définissez SUPER_ADMIN_PASSWORD dans .env en production. Mot de passe initial : celui de SUPER_ADMIN_PASSWORD ou défaut Admin@2024!',
        );
      }
    } catch (e) {
      this.logger.error(
        `Échec du seed super admin : ${e instanceof Error ? e.message : e}`,
      );
    }
  }
}
