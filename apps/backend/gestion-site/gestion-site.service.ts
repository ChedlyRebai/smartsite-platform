import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Site } from './entities/site.entity';
import { Team } from './entities/team.entity';
import { CreateSiteDto, UpdateSiteDto } from './dto';
import { HttpException, HttpStatus } from '@nestjs/common';

export interface SiteFilters {
  nom?: string;
  localisation?: string;
  isActif?: boolean;
  budgetMin?: number;
  budgetMax?: number;
  status?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class GestionSiteService {
  private readonly logger = new Logger(GestionSiteService.name);

  constructor(
    @InjectModel(Site.name) private siteModel: Model<Site>,
    @InjectModel(Team.name) private teamModel: Model<Team>,
    @InjectConnection() private connection: Connection,
  ) {}

  /**
   * Create a new site
   */
  async create(createSiteDto: CreateSiteDto, userId?: string): Promise<Site> {
    try {
      // Check if site with same name exists
      const existingSite = await this.siteModel.findOne({
        nom: { $regex: new RegExp(`^${createSiteDto.nom}$`, 'i') },
      });

      if (existingSite) {
        throw new BadRequestException(
          `Un site avec le nom "${createSiteDto.nom}" existe déjà`,
        );
      }

      const siteData: any = {
        ...createSiteDto,
      };

      if (userId) {
        siteData.createdBy = userId;
        siteData.updatedBy = userId;
      }

      const createdSite = new this.siteModel(siteData);
      const savedSite = await createdSite.save();

      this.logger.log(`Site créé: ${savedSite.nom} (${savedSite._id})`);
      return savedSite;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erreur lors de la création du site: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la création du site');
    }
  }

  /**
   * Get all sites with optional filters and pagination
   */
  async findAll(
    filters?: SiteFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Site>> {
    try {
      const query: Record<string, any> = {};

      // Apply filters
      if (filters) {
        if (filters.nom) {
          query.nom = { $regex: filters.nom, $options: 'i' };
        }
        if (filters.localisation) {
          query.localisation = { $regex: filters.localisation, $options: 'i' };
        }
        if (filters.isActif !== undefined) {
          query.isActif = filters.isActif;
        }
        if (filters.status) {
          query.status = filters.status;
        }
        if (filters.budgetMin !== undefined || filters.budgetMax !== undefined) {
          query.budget = {} as any;
          if (filters.budgetMin !== undefined) {
            (query.budget as any).$gte = filters.budgetMin;
          }
          if (filters.budgetMax !== undefined) {
            (query.budget as any).$lte = filters.budgetMax;
          }
        }
      }

      // Default pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const skip = (page - 1) * limit;

      // Sort
      const sort: any = {};
      if (pagination?.sortBy) {
        sort[pagination.sortBy] = pagination.sortOrder === 'desc' ? -1 : 1;
      } else {
        sort.createdAt = -1;
      }

      const [data, total] = await Promise.all([
        this.siteModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
        this.siteModel.countDocuments(query).exec(),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des sites: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la récupération des sites');
    }
  }

  /**
   * Get a single site by ID
   */
  async findById(id: string): Promise<Site> {
    try {
      const site = await this.siteModel.findById(id).exec();
      if (!site) {
        throw new NotFoundException(`Site avec l'ID "${id}" non trouvé`);
      }
      return site;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erreur lors de la récupération du site: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la récupération du site');
    }
  }

  /**
   * Search sites by name
   */
  async findByName(nom: string): Promise<Site[]> {
    try {
      return await this.siteModel
        .find({ nom: { $regex: nom, $options: 'i' } })
        .limit(20)
        .exec();
    } catch (error) {
      this.logger.error(`Erreur lors de la recherche de sites: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la recherche de sites');
    }
  }

  /**
   * Find sites by localisation
   */
  async findByLocalisation(localisation: string): Promise<Site[]> {
    try {
      return await this.siteModel
        .find({ localisation: { $regex: localisation, $options: 'i' } })
        .exec();
    } catch (error) {
      this.logger.error(
        `Erreur lors de la recherche par localisation: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Erreur lors de la recherche par localisation',
      );
    }
  }

  /**
   * Get only active sites
   */
  async findActiveSites(): Promise<Site[]> {
    try {
      return await this.siteModel.find({ isActif: true }).exec();
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des sites actifs: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Erreur lors de la récupération des sites actifs',
      );
    }
  }

  /**
   * Update a site
   */
  async update(
    id: string,
    updateSiteDto: UpdateSiteDto,
    userId?: string,
  ): Promise<Site> {
    try {
      // Check if site exists
      const existingSite = await this.siteModel.findById(id).exec();
      if (!existingSite) {
        throw new NotFoundException(`Site avec l'ID "${id}" non trouvé`);
      }

      // Check for duplicate name if name is being updated
      if (updateSiteDto.nom) {
        const duplicateSite = await this.siteModel.findOne({
          nom: { $regex: new RegExp(`^${updateSiteDto.nom}$`, 'i') },
          _id: { $ne: id },
        });

        if (duplicateSite) {
          throw new BadRequestException(
            `Un site avec le nom "${updateSiteDto.nom}" existe déjà`,
          );
        }
      }

      const updateData: any = { ...updateSiteDto };
      if (userId) {
        updateData.updatedBy = userId;
      }

      // Auto-complete: If progress is 100%, set status to 'completed'
      if (updateData.progress !== undefined && updateData.progress >= 100) {
        updateData.status = 'completed';
      }

      const updatedSite = await this.siteModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();

      if (!updatedSite) {
        throw new NotFoundException(`Site avec l'ID "${id}" non trouvé`);
      }

      this.logger.log(`Site mis à jour: ${updatedSite.nom} (${id})`);
      return updatedSite;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erreur lors de la mise à jour du site: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la mise à jour du site');
    }
  }

  /**
   * Soft delete a site (set isActif to false)
   */
  async softDelete(id: string): Promise<Site> {
    try {
      const site = await this.siteModel
        .findByIdAndUpdate(
          id,
          { isActif: false },
          { new: true },
        )
        .exec();

      if (!site) {
        throw new NotFoundException(`Site avec l'ID "${id}" non trouvé`);
      }

      this.logger.log(`Site soft-deleted: ${site.nom} (${id})`);
      return site;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erreur lors de la suppression du site: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la suppression du site');
    }
  }

  /**
   * Hard delete a site (permanent)
   */
  async remove(id: string): Promise<{ message: string; deletedId: string }> {
    try {
      this.logger.log(`Tentative de suppression du site avec l'ID: ${id}`);
      
      // First check if site exists
      const existingSite = await this.siteModel.findById(id).exec();
      if (!existingSite) {
        this.logger.warn(`Site non trouvé avec l'ID: ${id}`);
        throw new NotFoundException(`Site avec l'ID "${id}" non trouvé`);
      }

      this.logger.log(`Site trouvé: ${existingSite.nom}, suppression en cours...`);

      // Use deleteOne with the _id
      const result = await this.siteModel.deleteOne({ _id: id }).exec();
      
      this.logger.log(`Résultat de la suppression: ${JSON.stringify(result)}`);

      if (result.deletedCount === 0) {
        this.logger.error(`Échec de la suppression - deletedCount: 0`);
        throw new InternalServerErrorException('Échec de la suppression du site');
      }

      this.logger.log(`Site supprimé définitivement: ${existingSite.nom} (${id})`);
      return { 
        message: `Site "${existingSite.nom}" supprimé définitivement`,
        deletedId: id 
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la suppression définitive du site: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Erreur lors de la suppression définitive du site',
      );
    }
  }

  /**
   * Restore a soft-deleted site
   */
  async restore(id: string): Promise<Site> {
    try {
      const site = await this.siteModel
        .findByIdAndUpdate(
          id,
          { isActif: true },
          { new: true },
        )
        .exec();

      if (!site) {
        throw new NotFoundException(`Site avec l'ID "${id}" non trouvé`);
      }

      this.logger.log(`Site restauré: ${site.nom} (${id})`);
      return site;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erreur lors de la restauration du site: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la restauration du site');
    }
  }

  /**
   * Get statistics about sites
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    totalBudget: number;
    averageBudget: number;
    byLocalisation: { localisation: string; count: number }[];
  }> {
    try {
      const [total, active, inactive, stats] = await Promise.all([
        this.siteModel.countDocuments().exec(),
        this.siteModel.countDocuments({ isActif: true }).exec(),
        this.siteModel.countDocuments({ isActif: false }).exec(),
        this.siteModel.aggregate([
          {
            $group: {
              _id: '$localisation',
              count: { $sum: 1 },
              totalBudget: { $sum: '$budget' },
            },
          },
          { $sort: { count: -1 } },
        ]),
      ]);

      const totalBudget = stats.reduce((sum, item) => sum + item.totalBudget, 0);
      const averageBudget = total > 0 ? totalBudget / total : 0;

      return {
        total,
        active,
        inactive,
        totalBudget,
        averageBudget,
        byLocalisation: stats.map((item) => ({
          localisation: item._id,
          count: item.count,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des statistiques: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Erreur lors de la récupération des statistiques',
      );
    }
  }

  /**
   * Get total budget of all sites
   */
  async getTotalBudget(): Promise<number> {
    try {
      const result = await this.siteModel.aggregate([
        { $group: { _id: null, total: { $sum: '$budget' } } },
      ]);
      return result[0]?.total || 0;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération du budget total: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Erreur lors de la récupération du budget total',
      );
    }
  }

  // ============ TEAM ASSIGNMENT METHODS ============

  /**
   * Assign a MongoDB Team to a site (chantier)
   */
  async assignTeamToSite(siteId: string, teamId: string): Promise<Site> {
    try {
      // Verify site exists
      const site = await this.siteModel.findById(siteId).exec();
      if (!site) {
        throw new NotFoundException(`Site avec l'ID "${siteId}" non trouvé`);
      }

      // Check if team is already assigned to this site
      if (site.teamIds && site.teamIds.some(t => t.toString() === teamId)) {
        throw new BadRequestException('Cette équipe est déjà affectée à ce site');
      }

      // Add team to site's teamIds
      const updatedSite = await this.siteModel
        .findByIdAndUpdate(
          siteId,
          { $addToSet: { teamIds: new Types.ObjectId(teamId) } },
          { new: true },
        )
        .exec();

      this.logger.log(`Équipe MongoDB affectée au site: ${siteId}, équipe: ${teamId}`);
      return updatedSite;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erreur lors de l'affectation de l'équipe: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de l\'affectation de l\'équipe au site');
    }
  }

  /**
   * Remove a team from a site
   */
  async removeTeamFromSite(siteId: string, teamId: string): Promise<Site> {
    try {
      const site = await this.siteModel.findById(siteId).exec();
      if (!site) {
        throw new NotFoundException(`Site avec l'ID "${siteId}" non trouvé`);
      }

      // Check if team is assigned to this site
      if (!site.teamIds || !site.teamIds.some(t => t.toString() === teamId)) {
        throw new BadRequestException('Cette équipe n\'est pas affectée à ce site');
      }

      const updatedSite = await this.siteModel
        .findByIdAndUpdate(
          siteId,
          { $pull: { teamIds: new Types.ObjectId(teamId) } },
          { new: true },
        )
        .exec();

      this.logger.log(`Équipe retirée du site: ${siteId}, équipe: ${teamId}`);
      return updatedSite;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erreur lors du retrait de l'équipe: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors du retrait de l\'équipe du site');
    }
  }

  /**
   * View teams assigned to a site
   */
  async getTeamsAssignedToSite(siteId: string): Promise<any[]> {
    try {
      const site = await this.siteModel.findById(siteId)
        .populate({
          path: 'teamIds',
          select: 'name description teamCode isActive members manager site'
        })
        .exec();

      if (!site) {
        throw new NotFoundException(`Site avec l'ID "${siteId}" non trouvé`);
      }

      // Return the populated teamIds (renamed to teams for frontend compatibility)
      return site.teamIds ? site.teamIds.map((team: any) => ({
        ...team.toObject(),
        _id: team._id,
        id: team._id
      })) : [];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erreur lors de la récupération des équipes: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la récupération des équipes du site');
    }
  }

  /**
   * Get all sites with their assigned teams
   */
  async getAllSitesWithTeams(): Promise<Site[]> {
    try {
      return await this.siteModel.find()
        .populate({
          path: 'teamIds',
          select: 'name description teamCode'
        })
        .exec();
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des sites avec équipes: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la récupération des sites avec équipes');
    }
  }
}
