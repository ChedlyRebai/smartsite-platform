import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { GestionSiteService, SiteFilters, PaginationOptions, PaginatedResult } from './gestion-site.service';
import { CreateSiteDto, UpdateSiteDto } from './dto';

@Controller('gestion-sites')
export class GestionSiteController {
  private readonly logger = new Logger(GestionSiteController.name);
  
  constructor(private readonly gestionSiteService: GestionSiteService) {}

  /**
   * Create a new site
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSiteDto: CreateSiteDto) {
    return this.gestionSiteService.create(createSiteDto);
  }

  /**
   * Get all sites with pagination and filters
   */
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('nom') nom?: string,
    @Query('localisation') localisation?: string,
    @Query('isActif') isActif?: string,
    @Query('status') status?: string,
    @Query('budgetMin') budgetMin?: string,
    @Query('budgetMax') budgetMax?: string,
    @Query('projectId') projectId?: string,
  ): Promise<PaginatedResult<any>> {
    console.log('Controller received projectId:', projectId);
    // Parse optional numeric parameters
    const parsedBudgetMin = budgetMin ? parseInt(budgetMin, 10) : undefined;
    const parsedBudgetMax = budgetMax ? parseInt(budgetMax, 10) : undefined;
    const filters: SiteFilters = {
      nom,
      localisation,
      isActif: isActif !== undefined ? isActif === 'true' : undefined,
      status,
      budgetMin: parsedBudgetMin,
      budgetMax: parsedBudgetMax,
      projectId,
    };

    const pagination: PaginationOptions = {
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    return this.gestionSiteService.findAll(filters, pagination);
  }

  /**
   * Get site statistics
   */
  @Get('statistics')
  async getStatistics() {
    return this.gestionSiteService.getStatistics();
  }

  /**
   * Get total budget of all sites
   */
  @Get('budget/total')
  async getTotalBudget() {
    const total = await this.gestionSiteService.getTotalBudget();
    return { totalBudget: total };
  }

  /**
   * Get only active sites
   */
  @Get('active')
  async findActiveSites() {
    return this.gestionSiteService.findActiveSites();
  }

  /**
   * Get a single site by ID
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.gestionSiteService.findById(id);
  }

  /**
   * Search sites by name
   */
  @Get('search/nom/:nom')
  async findByName(@Param('nom') nom: string) {
    return this.gestionSiteService.findByName(nom);
  }

  /**
   * Find sites by localisation
   */
  @Get('localisation/:localisation')
  async findByLocalisation(@Param('localisation') localisation: string) {
    return this.gestionSiteService.findByLocalisation(localisation);
  }

  /**
   * Update a site
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSiteDto: UpdateSiteDto,
  ) {
    return this.gestionSiteService.update(id, updateSiteDto);
  }

  /**
   * Hard delete a site (permanent) - must be before :id/soft to avoid route conflicts
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    this.logger.log(`Demande de suppression hard delete reçue pour l'ID: ${id}`);
    const result = await this.gestionSiteService.remove(id);
    this.logger.log(`Résultat de la suppression: ${JSON.stringify(result)}`);
    return result;
  }

  @Get('teams/:teamId/sites')
  async getSitesByTeam(@Param('teamId') teamId: string) {
    return this.gestionSiteService.getSiteByteamId(teamId);
  }
  /**
   * Soft delete a site (set isActif to false)
   */
  @Delete(':id/soft')
  @HttpCode(HttpStatus.OK)
  async softDelete(@Param('id') id: string) {
    this.logger.log(`Demande de soft delete reçue pour l'ID: ${id}`);
    return this.gestionSiteService.softDelete(id);
  }

  /**
   * Restore a soft-deleted site
   */
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id') id: string) {
    return this.gestionSiteService.restore(id);
  }

  // ============ TEAM ASSIGNMENT ENDPOINTS ============

  /**
   * Assign a team to a site
   */
  @Post(':id/teams')
  @HttpCode(HttpStatus.OK)
  async assignTeam(
    @Param('id') siteId: string,
    @Body() body: { userId: string },
  ) {
    return this.gestionSiteService.assignTeamToSite(siteId, body.userId);
  }

  /**
   * Remove a team from a site
   */
  @Delete(':id/teams/:userId')
  @HttpCode(HttpStatus.OK)
  async removeTeam(
    @Param('id') siteId: string,
    @Param('userId') userId: string,
  ) {
    return this.gestionSiteService.removeTeamFromSite(siteId, userId);
  }

  /**
   * View teams assigned to a site
   */
  @Get(':id/teams')
  async getTeams(@Param('id') siteId: string) {
    return this.gestionSiteService.getTeamsAssignedToSite(siteId);
  }

  /**
   * Get all sites with their assigned teams
   */
  @Get('teams/all')
  async getAllSitesWithTeams(@Query('projectId') projectId?: string) {
    return this.gestionSiteService.getAllSitesWithTeams(projectId);
  }

  /**
   * Get all team IDs that are assigned to any site (for Teams page to check site assignment)
   */
  @Get('teams/assigned-ids')
  async getAssignedTeamIds(@Query('projectId') projectId?: string) {
    const sites = await this.gestionSiteService.getAllSitesWithTeams(projectId || undefined);
    
    // Create a map of teamId -> site info with status
    const teamToSiteMap: Record<string, { siteId: string; siteName: string; status: string }> = {};
    sites.forEach((site: any) => {
      if (site.teamIds) {
        site.teamIds.forEach((teamId: string) => {
          teamToSiteMap[teamId] = {
            siteId: site._id.toString(),

            siteName: site.nom,

            status: site.status || 'planning'
          };
        });
      }
    });
    
    return teamToSiteMap;
  }

  /**
   * Geocode an address to get coordinates
   */
  @Get('geocode/search')
  async geocodeAddress(@Query('address') address: string) {
    this.logger.log(`🔍 Recherche de géocodage pour l'adresse: ${address}`);
    return this.gestionSiteService.geocodeAddress(address);
  }

  /**
   * Advanced geocoding with better map integration
   */
  @Post('geocode/search-advanced')
  async geocodeAddressAdvanced(@Body() body: { address: string; country?: string; city?: string }) {
    this.logger.log(`🔍 Recherche avancée de géocodage pour: ${body.address}`);
    return this.gestionSiteService.geocodeAddressAdvanced(body.address, body.country, body.city);
  }
}
