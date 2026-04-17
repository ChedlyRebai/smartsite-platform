import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Site } from './entities/site.entity';
import { CreateSiteInput, UpdateSiteInput } from './dto/site.dto';

@Injectable()
export class SitesService {
  constructor(@InjectModel(Site.name) private siteModel: Model<Site>) {}

  /**
   * Créer un site - le createdBy est automatiquement l'utilisateur connecté
   */
  async create(createSiteDto: CreateSiteInput, userId: string): Promise<Site> {
    const createdSite = new this.siteModel({
      ...createSiteDto,
      createdBy: new Types.ObjectId(userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return createdSite.save();
  }

  /**
   * Lister les sites selon le rôle:
   * - site_manager → uniquement ses propres sites (createdBy = userId)
   * - super_admin, director → tous les sites
   */
  async findAll(userId: string, userRole: string): Promise<Site[]> {
    const query: any = {};

    if (userRole === 'site_manager') {
      query.createdBy = new Types.ObjectId(userId);
    }

    return this.siteModel.find(query).sort({ createdAt: -1 }).exec();
  }

  /**
   * Récupérer un site par ID (avec vérification d'accès pour site_manager)
   */
  async findOne(id: string, userId?: string, userRole?: string): Promise<Site> {
    const site = await this.siteModel.findById(id).exec();

    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    // Vérification d'accès pour site_manager
    if (userRole === 'site_manager' && site.createdBy.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this site');
    }

    return site;
  }

  /**
   * Mettre à jour un site
   */
  async update(
    id: string,
    updateSiteDto: UpdateSiteInput,
    userId: string,
    userRole: string,
  ): Promise<Site> {
    // Vérifier l'accès
    const site = await this.findOne(id, userId, userRole);

    const updateData: any = { ...updateSiteDto };
    updateData.updatedAt = new Date();

    const updatedSite = await this.siteModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedSite) {
      throw new NotFoundException(`Site with ID ${id} not found after update`);
    }

    return updatedSite;
  }

  /**
   * Soft delete (désactiver) un site
   */
  async softDelete(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<Site> {
    const site = await this.findOne(id, userId, userRole);

    if (!site.is_active) {
      throw new BadRequestException('Site is already inactive');
    }

    site.is_active = false;
    site.updatedAt = new Date();

    return site.save();
  }

  /**
   * Réactiver un site
   */
  async reactivate(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<Site> {
    const site = await this.findOne(id, userId, userRole);

    if (site.is_active) {
      throw new BadRequestException('Site is already active');
    }

    site.is_active = true;
    site.updatedAt = new Date();

    return site.save();
  }
}
