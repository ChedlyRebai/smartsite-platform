import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db, Collection } from 'mongodb';

export interface SiteDocument {
  _id: any;
  nom: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  coordonnees?: {
    latitude?: number;
    longitude?: number;
  };
  isActive?: boolean;
  status?: string;
}

@Injectable()
export class SitesService {
  private readonly logger = new Logger(SitesService.name);
  private client: MongoClient;
  private db: Db;
  private sitesCollection: Collection<SiteDocument>;

  constructor(private configService: ConfigService) {
    this.initializeSiteConnection();
  }

  private async initializeSiteConnection() {
    try {
      const uri =
        this.configService.get('SITES_MONGODB_URI') ||
        'mongodb://localhost:27017/smartsite';
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db();
      this.sitesCollection = this.db.collection('sites');
      this.logger.log('✅ Connexion MongoDB sites établie');
    } catch (error) {
      this.logger.error('❌ Erreur de connexion MongoDB sites:', error);
    }
  }

  async findAll(): Promise<SiteDocument[]> {
    try {
      if (!this.sitesCollection) {
        await this.initializeSiteConnection();
      }

      const sites = await this.sitesCollection
        .find({ $or: [{ isActive: true }, { isActive: { $exists: false } }] })
        .toArray();

      this.logger.log(`${sites.length} sites trouvés dans la base de données`);
      return sites;
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des sites:', error);
      return [];
    }
  }

  async findOne(id: string): Promise<SiteDocument | null> {
    try {
      if (!this.sitesCollection) {
        await this.initializeSiteConnection();
      }

      const { ObjectId } = require('mongodb');
      let query: any;

      try {
        query = { _id: new ObjectId(id) };
      } catch {
        query = { _id: id };
      }

      return await this.sitesCollection.findOne(query);
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération du site ${id}:`, error);
      return null;
    }
  }

  async getSiteCount(): Promise<number> {
    try {
      if (!this.sitesCollection) {
        await this.initializeSiteConnection();
      }

      return await this.sitesCollection.countDocuments({
        $or: [{ isActive: true }, { isActive: { $exists: false } }],
      });
    } catch (error) {
      this.logger.error('Erreur lors du comptage des sites:', error);
      return 0;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
    }
  }
}
