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
import axios from 'axios';

export interface SiteFilters {
  nom?: string;
  localisation?: string;
  isActif?: boolean;
  budgetMin?: number;
  budgetMax?: number;
  status?: string;
  projectId?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
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
      this.logger.log(`Creating site: ${JSON.stringify(createSiteDto)}`);
      
      // Check if site with same name exists
      const existingSite = await this.siteModel.findOne({
        nom: { $regex: new RegExp(`^${createSiteDto.nom}$`, "i") },
      });

      if (existingSite) {
        throw new BadRequestException(
          `Un site avec le nom "${createSiteDto.nom}" existe déjà`,
        );
      }

      // Validate budget against project budget if projectId is provided
      if (createSiteDto.projectId) {
        let project: any = null;
        try {
          const projectsUrl = process.env.GESTION_PROJECTS_URL || 'http://localhost:3007';
          const projectResponse = await axios.get(`${projectsUrl}/projects/${createSiteDto.projectId}`, { timeout: 5000 });
          project = projectResponse.data;
        } catch (fetchError: any) {
          this.logger.warn(`Could not fetch project for budget validation: ${fetchError.message}`);
        }

        if (project) {
          if (!project.budget || project.budget <= 0) {
            throw new BadRequestException(`Project has no budget defined. Please set project budget first.`);
          }

          // Check existing sites for this project
          const existingSites = await this.siteModel.find({ projectId: createSiteDto.projectId });
          const existingBudget = existingSites.reduce((sum: number, s: Site) => sum + (s.budget || 0), 0);
          const newTotalBudget = existingBudget + (createSiteDto.budget || 0);
          const projectBudget = project.budget || 0;

          this.logger.log(`Budget check: existing=${existingBudget}, new=${createSiteDto.budget}, total=${newTotalBudget}, project=${projectBudget}`);

          if (newTotalBudget > projectBudget) {
            throw new BadRequestException(
              `Total sites budget (${newTotalBudget} TND) exceeds project budget (${projectBudget} TND)`
            );
          }

          // Set clientName from project if not provided
          if (!createSiteDto.clientName && project.clientName) {
            createSiteDto.clientName = project.clientName;
          }
        }
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
    } catch (error:any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erreur lors de la création du site: ${error.message}`);
      throw new InternalServerErrorException(
        "Erreur lors de la création du site",
      );
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
          query.nom = { $regex: filters.nom, $options: "i" };
        }
        if (filters.localisation) {
          query.localisation = { $regex: filters.localisation, $options: "i" };
        }
        if (filters.isActif !== undefined) {
          query.isActif = filters.isActif;
        }
        if (filters.status) {
          query.status = filters.status;
        }
        if (
          filters.budgetMin !== undefined ||
          filters.budgetMax !== undefined
        ) {
          query.budget = {} as any;
          if (filters.budgetMin !== undefined) {
            (query.budget as any).$gte = filters.budgetMin;
          }
          if (filters.budgetMax !== undefined) {
            (query.budget as any).$lte = filters.budgetMax;
          }
        }
        if (filters.projectId) {
          console.log('Filtering by projectId:', filters.projectId);
          query.projectId = filters.projectId;
        }
      }

      console.log('Final query:', JSON.stringify(query));

      // Default pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const skip = (page - 1) * limit;

      // Sort
      const sort: any = {};
      if (pagination?.sortBy) {
        sort[pagination.sortBy] = pagination.sortOrder === "desc" ? -1 : 1;
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
    } catch (error:any) {
      this.logger.error(
        `Erreur lors de la récupération des sites: ${error.message}`,
      );
      throw new InternalServerErrorException(
        "Erreur lors de la récupération des sites",
      );
    }
  }

  /**
   * Get a single site by ID
   */
  async findById(id: string): Promise<Site> {
    try {
      const site = await this.siteModel.findById(id).populate("teamIds");
      if (!site) {
        throw new NotFoundException(`Site avec l'ID "${id}" non trouvé`);
      }
      return site;
    } catch (error:any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la récupération du site: ${error.message}`,
      );
      throw new InternalServerErrorException(
        "Erreur lors de la récupération du site",
      );
    }
  }

  /**
   * Search sites by name
   */
  async findByName(nom: string): Promise<Site[]> {
    try {
      return await this.siteModel
        .find({ nom: { $regex: nom, $options: "i" } })
        .limit(20)
        .exec();
    } catch (error:any) {
      this.logger.error(
        `Erreur lors de la recherche de sites: ${error.message}`,
      );
      throw new InternalServerErrorException(
        "Erreur lors de la recherche de sites",
      );
    }
  }

  /**
   * Find sites by localisation
   */
  async findByLocalisation(localisation: string): Promise<Site[]> {
    try {
      return await this.siteModel
        .find({ localisation: { $regex: localisation, $options: "i" } })
        .exec();
    } catch (error:any) {
      this.logger.error(
        `Erreur lors de la recherche par localisation: ${error.message}`,
      );
      throw new InternalServerErrorException(
        "Erreur lors de la recherche par localisation",
      );
    }
  }

  /**
   * Get only active sites
   */
  async findActiveSites(): Promise<Site[]> {
    try {
      return await this.siteModel.find({ isActif: true }).exec();
    } catch (error:any) {
      this.logger.error(
        `Erreur lors de la récupération des sites actifs: ${error.message}`,
      );
      throw new InternalServerErrorException(
        "Erreur lors de la récupération des sites actifs",
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
          nom: { $regex: new RegExp(`^${updateSiteDto.nom}$`, "i") },
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
        updateData.status = "completed";

      }

      const updatedSite = await this.siteModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();

      if (!updatedSite) {
        throw new NotFoundException(`Site avec l'ID "${id}" non trouvé`);
      }

      this.logger.log(`Site mis à jour: ${updatedSite.nom} (${id})`);
      return updatedSite;
    } catch (error:any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la mise à jour du site: ${error.message}`,
      );
      throw new InternalServerErrorException(
        "Erreur lors de la mise à jour du site",
      );
    }
  }

  /**
   * Soft delete a site (set isActif to false)
   */
  async softDelete(id: string): Promise<Site> {
    try {
      const site = await this.siteModel
        .findByIdAndUpdate(id, { isActif: false }, { new: true })
        .exec();

      if (!site) {
        throw new NotFoundException(`Site avec l'ID "${id}" non trouvé`);
      }

      this.logger.log(`Site soft-deleted: ${site.nom} (${id})`);
      return site;
    } catch (error:any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la suppression du site: ${error.message}`,
      );
      throw new InternalServerErrorException(
        "Erreur lors de la suppression du site",
      );
    }
  }

  async getSiteByteamId(teamId: string): Promise<Site[]> {
    try {
      if (!teamId) {
        throw new BadRequestException("L'ID de l'équipe est requis");
      }

      if (!Types.ObjectId.isValid(teamId)) {
        throw new BadRequestException("L'ID de l'équipe est invalide");
      }

      const sites = await this.siteModel
        .find({ teamIds: { $in: [new Types.ObjectId(teamId)] } })
        .exec();
      return sites;
    } catch (error:any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la récupération des sites par équipe: ${error.message}`,
      );
      throw new InternalServerErrorException(
        "Erreur lors de la récupération des sites par équipe",
      );
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

      this.logger.log(
        `Site trouvé: ${existingSite.nom}, suppression en cours...`,
      );

      // Use deleteOne with the _id
      const result = await this.siteModel.deleteOne({ _id: id }).exec();

      this.logger.log(`Résultat de la suppression: ${JSON.stringify(result)}`);

      if (result.deletedCount === 0) {
        this.logger.error(`Échec de la suppression - deletedCount: 0`);
        throw new InternalServerErrorException(
          "Échec de la suppression du site",
        );
      }

      this.logger.log(
        `Site supprimé définitivement: ${existingSite.nom} (${id})`,
      );
      return {
        message: `Site "${existingSite.nom}" supprimé définitivement`,
        deletedId: id,
      };
    } catch (error:any) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la suppression définitive du site: ${error.message}`,
      );
      throw new InternalServerErrorException(
        "Erreur lors de la suppression définitive du site",
      );
    }
  }

  /**
   * Restore a soft-deleted site
   */
  async restore(id: string): Promise<Site> {
    try {
      const site = await this.siteModel
        .findByIdAndUpdate(id, { isActif: true }, { new: true })
        .exec();

      if (!site) {
        throw new NotFoundException(`Site avec l'ID "${id}" non trouvé`);
      }

      this.logger.log(`Site restauré: ${site.nom} (${id})`);
      return site;
    } catch (error:any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la restauration du site: ${error.message}`,
      );
      throw new InternalServerErrorException(
        "Erreur lors de la restauration du site",
      );
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
              _id: "$localisation",
              count: { $sum: 1 },
              totalBudget: { $sum: "$budget" },
            },
          },
          { $sort: { count: -1 } },
        ]),
      ]);

      const totalBudget = stats.reduce(
        (sum, item) => sum + item.totalBudget,
        0,
      );
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
    } catch (error:any) {
      this.logger.error(
        `Erreur lors de la récupération des statistiques: ${error.message}`,
      );
      throw new InternalServerErrorException(
        "Erreur lors de la récupération des statistiques",
      );
    }
  }

  /**
   * Get total budget of all sites
   */
  async getTotalBudget(): Promise<number> {
    try {
      const result = await this.siteModel.aggregate([
        { $group: { _id: null, total: { $sum: "$budget" } } },
      ]);
      return result[0]?.total || 0;
    } catch (error:any) {
      this.logger.error(
        `Erreur lors de la récupération du budget total: ${error.message}`,
      );
      throw new InternalServerErrorException(
        "Erreur lors de la récupération du budget total",
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
      if (site.teamIds && site.teamIds.some((t) => t.toString() === teamId)) {
        throw new BadRequestException(
          "Cette équipe est déjà affectée à ce site",
        );
      }

      // Add team to site's teamIds
      const updatedSite = await this.siteModel
        .findByIdAndUpdate(
          siteId,
          { $addToSet: { teamIds: new Types.ObjectId(teamId) } },
          { new: true },
        )
        .exec();

      this.logger.log(
        `Équipe MongoDB affectée au site: ${siteId}, équipe: ${teamId}`,
      );
      return updatedSite;
    } catch (error:any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de l'affectation de l'équipe: ${error.message}`,
      );
      throw new InternalServerErrorException(
        "Erreur lors de l'affectation de l'équipe au site",
      );
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
      if (!site.teamIds || !site.teamIds.some((t) => t.toString() === teamId)) {
        throw new BadRequestException(
          "Cette équipe n'est pas affectée à ce site",
        );
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
    } catch (error:any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Erreur lors du retrait de l'équipe: ${error.message}`);
      throw new InternalServerErrorException(
        "Erreur lors du retrait de l'équipe du site",
      );
    }
  }

  /**
   * View teams assigned to a site
   */
  async getTeamsAssignedToSite(siteId: string): Promise<any[]> {
    try {
      const site = await this.siteModel
        .findById(siteId)
        .populate({
          path: "teamIds",
          select: "name description teamCode isActive members manager site",
        })
        .exec();

      if (!site) {
        throw new NotFoundException(`Site avec l'ID "${siteId}" non trouvé`);
      }

      // Return the populated teamIds (renamed to teams for frontend compatibility)
      return site.teamIds
        ? site.teamIds.map((team: any) => ({
            ...team.toObject(),
            _id: team._id,
            id: team._id,
          }))
        : [];
    } catch (error:any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la récupération des équipes: ${error.message}`,
      );
      throw new InternalServerErrorException(
        "Erreur lors de la récupération des équipes du site",
      );
    }
  }

  /**
   * Get all sites with their assigned teams
   */
  // async getAllSitesWithTeams(): Promise<Site[]> {
  //   try {
  //     return await this.siteModel
  //       .find()
  //       .populate({
  //         path: "teamIds",
  //         select: "name description teamCode",
  //       })
  //       .exec();
  //   } catch (error:Error) {
  //     this.logger.error(
  //       `Erreur lors de la récupération des sites avec équipes: ${error.message}`,
  //     );
  //     throw new InternalServerErrorException(
  //       "Erreur lors de la récupération des sites avec équipes",
  //     );
  //   }
  // }

  // ============ TEAM ASSIGNMENT METHODS ============

  /**
   * Assign a MongoDB Team to a site (chantier)
   */
  async assignTeamToSites(siteId: string, teamId: string): Promise<Site> {
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
    } catch (error:any) {
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
  async removeTeamFromSites(siteId: string, teamId: string): Promise<Site> {
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
    } catch (error:any) {
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
  async getTeamsAssignedToSites(siteId: string): Promise<any[]> {
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
    } catch (error:any) {
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
  async getAllSitesWithTeams(projectId?: string): Promise<Site[]> {
    try {
      const query = projectId ? { projectId } : {};
      return await this.siteModel.find(query)
        .populate({
          path: 'teamIds',
          select: 'name description teamCode'
        })
        .exec();
    } catch (error:any) {
      this.logger.error(`Erreur lors de la récupération des sites avec équipes: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la récupération des sites avec équipes');
    }
  }

  /**
   * Geocode an address to get coordinates using Nominatim (OpenStreetMap)
   */
  async geocodeAddress(address: string): Promise<any> {
    try {
      if (!address || address.trim().length === 0) {
        throw new BadRequestException('L\'adresse ne peut pas être vide');
      }

      this.logger.log(`🌍 Géocodage de l'adresse: ${address}`);

      // Utiliser l'API Nominatim d'OpenStreetMap (gratuite)
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          addressdetails: 1,
          limit: 5, // Retourner jusqu'à 5 résultats
        },
        headers: {
          'User-Agent': 'SmartSite-Platform/1.0', // Nominatim requiert un User-Agent
        },
        timeout: 10000,
      });

      if (!response.data || response.data.length === 0) {
        this.logger.warn(`❌ Aucun résultat trouvé pour l'adresse: ${address}`);
        return {
          success: false,
          message: 'Aucune adresse trouvée. Veuillez vérifier l\'adresse saisie.',
          results: [],
        };
      }

      // Formater les résultats
      const results = response.data.map((result: any) => ({
        displayName: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        address: {
          road: result.address?.road,
          city: result.address?.city || result.address?.town || result.address?.village,
          state: result.address?.state,
          country: result.address?.country,
          postcode: result.address?.postcode,
        },
        boundingBox: result.boundingbox,
        type: result.type,
        importance: result.importance,
      }));

      this.logger.log(`✅ ${results.length} résultat(s) trouvé(s) pour l'adresse: ${address}`);

      return {
        success: true,
        message: `${results.length} adresse(s) trouvée(s)`,
        results: results,
        query: address,
      };
    } catch (error) {
      this.logger.error(`❌ Erreur lors du géocodage de l'adresse: ${error.message}`);
      
      if (error.response?.status === 429) {
        throw new HttpException(
          'Trop de requêtes de géocodage. Veuillez réessayer dans quelques secondes.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new InternalServerErrorException(
        `Erreur lors de la recherche de l'adresse: ${error.message}`,
      );
    }
  }

  /**
   * Advanced geocoding with better map integration and Tunisia focus
   */
  async geocodeAddressAdvanced(address: string, country?: string, city?: string): Promise<any> {
    try {
      if (!address || address.trim().length === 0) {
        throw new BadRequestException('L\'adresse ne peut pas être vide');
      }

      this.logger.log(`🌍 Géocodage avancé de l'adresse: ${address}`);

      // Construire la requête avec priorité pour la Tunisie
      let searchQuery = address;
      if (city) {
        searchQuery = `${address}, ${city}`;
      }
      if (country) {
        searchQuery = `${searchQuery}, ${country}`;
      } else {
        // Par défaut, chercher en Tunisie
        searchQuery = `${searchQuery}, Tunisia`;
      }

      // Utiliser l'API Nominatim avec des paramètres optimisés
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: searchQuery,
          format: 'json',
          addressdetails: 1,
          limit: 10,
          countrycodes: country === 'Tunisia' || !country ? 'tn' : undefined, // Priorité Tunisie
          bounded: 1,
          viewbox: country === 'Tunisia' || !country ? '7.5,30.2,11.6,37.5' : undefined, // Bounding box Tunisie
        },
        headers: {
          'User-Agent': 'SmartSite-Platform/1.0',
        },
        timeout: 15000,
      });

      if (!response.data || response.data.length === 0) {
        // Essayer une recherche plus large sans restrictions géographiques
        this.logger.log(`🔄 Recherche élargie pour: ${address}`);
        
        const fallbackResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: address,
            format: 'json',
            addressdetails: 1,
            limit: 5,
          },
          headers: {
            'User-Agent': 'SmartSite-Platform/1.0',
          },
          timeout: 10000,
        });

        if (!fallbackResponse.data || fallbackResponse.data.length === 0) {
          this.logger.warn(`❌ Aucun résultat trouvé pour l'adresse: ${address}`);
          return {
            success: false,
            message: 'Aucune adresse trouvée. Veuillez vérifier l\'adresse saisie.',
            results: [],
            suggestions: [
              'Vérifiez l\'orthographe de l\'adresse',
              'Essayez avec moins de détails (ex: juste le nom de la ville)',
              'Utilisez des noms en français ou en arabe',
            ],
          };
        }

        response.data = fallbackResponse.data;
      }

      // Formater les résultats avec plus de détails
      const results = response.data.map((result: any, index: number) => ({
        id: index,
        displayName: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        coordinates: {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
        },
        address: {
          road: result.address?.road || result.address?.pedestrian,
          houseNumber: result.address?.house_number,
          city: result.address?.city || result.address?.town || result.address?.village,
          suburb: result.address?.suburb || result.address?.neighbourhood,
          state: result.address?.state || result.address?.county,
          country: result.address?.country,
          countryCode: result.address?.country_code,
          postcode: result.address?.postcode,
        },
        boundingBox: result.boundingbox ? {
          south: parseFloat(result.boundingbox[0]),
          north: parseFloat(result.boundingbox[1]),
          west: parseFloat(result.boundingbox[2]),
          east: parseFloat(result.boundingbox[3]),
        } : null,
        type: result.type,
        class: result.class,
        importance: result.importance,
        confidence: this.calculateConfidence(result, address),
        mapUrl: `https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lon}&zoom=16`,
      }));

      // Trier par confiance et importance
      results.sort((a, b) => (b.confidence * b.importance) - (a.confidence * a.importance));

      this.logger.log(`✅ ${results.length} résultat(s) trouvé(s) pour l'adresse: ${address}`);

      return {
        success: true,
        message: `${results.length} adresse(s) trouvée(s)`,
        results: results,
        query: address,
        searchQuery: searchQuery,
        bestMatch: results[0] || null,
        mapCenter: results[0] ? {
          lat: results[0].lat,
          lng: results[0].lng,
          zoom: 16,
        } : null,
      };
    } catch (error) {
      this.logger.error(`❌ Erreur lors du géocodage avancé: ${error.message}`);
      
      if (error.response?.status === 429) {
        throw new HttpException(
          'Trop de requêtes de géocodage. Veuillez réessayer dans quelques secondes.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new InternalServerErrorException(
        `Erreur lors de la recherche avancée de l'adresse: ${error.message}`,
      );
    }
  }

  /**
   * Calculate confidence score for geocoding result
   */
  private calculateConfidence(result: any, originalQuery: string): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on result type
    if (result.type === 'house') confidence += 0.3;
    else if (result.type === 'building') confidence += 0.25;
    else if (result.type === 'road') confidence += 0.2;
    else if (result.type === 'city') confidence += 0.15;

    // Boost confidence if address components match query
    const queryLower = originalQuery.toLowerCase();
    const displayLower = result.display_name.toLowerCase();
    
    if (displayLower.includes(queryLower)) confidence += 0.2;
    
    // Boost confidence for Tunisia results
    if (result.address?.country_code === 'tn') confidence += 0.1;

    return Math.min(confidence, 1.0);
  }
}
