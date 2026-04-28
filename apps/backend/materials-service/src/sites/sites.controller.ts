import { Controller, Get, Param, Logger } from '@nestjs/common';
import { SitesService, SiteDocument } from './sites.service';

@Controller('sites')
export class SitesController {
  private readonly logger = new Logger(SitesController.name);

  constructor(private readonly sitesService: SitesService) {}

  @Get()
  async findAll() {
    try {
      this.logger.log('🏗️ Récupération de tous les sites depuis MongoDB');
      const sites = await this.sitesService.findAll();
      
      return {
        success: true,
        data: sites,
        count: sites.length,
        message: `${sites.length} sites trouvés`,
        source: 'MongoDB smartsite/sites',
      };
    } catch (error) {
      this.logger.error('❌ Erreur lors de la récupération des sites:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des sites',
        data: [],
        count: 0,
        error: error.message,
      };
    }
  }

  @Get('test')
  async testConnection() {
    try {
      this.logger.log('🧪 Test de connexion aux sites MongoDB...');
      const count = await this.sitesService.getSiteCount();
      const sites = await this.sitesService.findAll();
      
      return {
        success: true,
        message: 'Connexion MongoDB sites OK',
        data: {
          database: 'smartsite',
          collection: 'sites',
          totalSites: count,
          sitesFound: sites.length,
          sites: sites.slice(0, 3).map(s => ({
            _id: s._id,
            nom: s.nom,
            ville: s.ville,
            coordonnees: s.coordonnees,
          })),
        },
      };
    } catch (error) {
      this.logger.error('❌ Erreur test sites:', error);
      return {
        success: false,
        message: 'Erreur de connexion MongoDB sites',
        error: error.message,
      };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const site = await this.sitesService.findOne(id);
      
      if (!site) {
        return {
          success: false,
          message: `Site ${id} non trouvé`,
          data: null,
        };
      }

      return {
        success: true,
        data: site,
        message: 'Site trouvé',
      };
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la récupération du site ${id}:`, error);
      return {
        success: false,
        message: `Erreur lors de la récupération du site ${id}`,
        data: null,
        error: error.message,
      };
    }
  }
}