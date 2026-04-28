import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Material } from '../entities/material.entity';
import { MLTrainingService } from './ml-training.service';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db, Collection } from 'mongodb';

export interface SupplierSuggestion {
  supplierId: string;
  supplierName: string;
  estimatedDeliveryDays: number;
  price?: number;
  isPreferred: boolean;
  telephone?: string;
  email?: string;
  adresse?: string;
  ville?: string;
  specialites?: string[];
  evaluation?: number;
  coordonnees?: {
    latitude?: number;
    longitude?: number;
  };
}

interface SupplierDocument {
  _id: any;
  nom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  siteWeb?: string;
  contactPrincipal?: string;
  specialites?: string[];
  statut?: string;
  delaiLivraison?: number;
  evaluation?: number;
  notes?: string;
  materialsSupplied?: any[];
  coordonnees?: {
    latitude?: number;
    longitude?: number;
  };
  isActive?: boolean;
}

export interface AutoOrderRecommendation {
  materialId: string;
  materialName: string;
  materialCode: string;
  currentStock: number;
  consumptionRate: number;
  predictedHoursToOutOfStock: number;
  autoSuggestOrder: boolean;
  recommendedQuantity: number;
  leadTimeDays: number;
  safetyStock: number;
  urgencyLevel: 'critical' | 'warning' | 'info';
  message: string;
  reason: string;
}

@Injectable()
export class IntelligentRecommendationService {
  private readonly logger = new Logger(IntelligentRecommendationService.name);
  private readonly DEFAULT_LEAD_TIME_DAYS = 7;
  private readonly SAFETY_STOCK_FACTOR = 1.5;
  private client: MongoClient;
  private db: Db;
  private suppliersCollection: Collection<SupplierDocument>;

  constructor(
    @InjectModel(Material.name) private materialModel: Model<Material>,
    private readonly mlTrainingService: MLTrainingService,
    private configService: ConfigService,
  ) {
    this.initializeSupplierConnection();
  }

  private async initializeSupplierConnection() {
    try {
      const uri =
        this.configService.get('SUPPLIERS_MONGODB_URI') ||
        'mongodb://localhost:27017/smartsite-fournisseurs';
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db();
      this.suppliersCollection = this.db.collection('fournisseurs');
      this.logger.log(
        '✅ Connexion MongoDB fournisseurs établie dans IntelligentRecommendationService',
      );
    } catch (error) {
      this.logger.error('❌ Erreur de connexion MongoDB fournisseurs:', error);
    }
  }

  async checkAutoOrderNeeded(
    materialId: string,
  ): Promise<AutoOrderRecommendation> {
    const material = await this.materialModel.findById(materialId).exec();
    if (!material) {
      throw new Error(`Materiau ${materialId} non trouve`);
    }

    let consumptionRate = material.consumptionRate || 1;
    let predictedHoursToOutOfStock = 999;

    if (this.mlTrainingService.hasModel(materialId)) {
      try {
        const prediction = await this.mlTrainingService.predictStock(
          materialId,
          24,
          material.quantity,
          material.stockMinimum,
        );
        predictedHoursToOutOfStock = prediction.hoursToOutOfStock;
        consumptionRate = prediction.consumptionRate;
      } catch {
        this.logger.warn(
          `ML prediction failed for ${materialId}, using fallback`,
        );
      }
    }

    if (predictedHoursToOutOfStock === 999) {
      const effectiveRate = Math.max(1, consumptionRate);
      predictedHoursToOutOfStock = material.quantity / effectiveRate;
    }

    const autoSuggestOrder = predictedHoursToOutOfStock < 48;
    const leadTimeDays = this.getLeadTimeForMaterial(material);
    const leadTimeHours = leadTimeDays * 24;
    const safetyStock = this.calculateSafetyStock(material, consumptionRate);
    const recommendedQuantity = Math.ceil(
      consumptionRate * leadTimeHours + safetyStock,
    );

    let urgencyLevel: 'critical' | 'warning' | 'info' = 'info';
    let message = '';
    let reason = '';

    if (predictedHoursToOutOfStock < 24) {
      urgencyLevel = 'critical';
      message = `URGENT: Rupture dans ${Math.floor(predictedHoursToOutOfStock)}h!`;
      reason = `Stock critique: ${material.quantity} ${material.unit} restants`;
    } else if (predictedHoursToOutOfStock < 48) {
      urgencyLevel = 'warning';
      message = `Attention: Rupture dans ${Math.floor(predictedHoursToOutOfStock)}h`;
      reason = `Stock bas: ${material.quantity} ${material.unit} / seuil ${material.stockMinimum}`;
    } else {
      message = `Stock suffisant pour ${Math.floor(predictedHoursToOutOfStock / 24)} jours`;
      reason = 'Pas de commande immediate necessaire';
    }

    return {
      materialId: material._id.toString(),
      materialName: material.name,
      materialCode: material.code,
      currentStock: material.quantity,
      consumptionRate: Math.round(consumptionRate * 100) / 100,
      predictedHoursToOutOfStock: Math.floor(predictedHoursToOutOfStock),
      autoSuggestOrder,
      recommendedQuantity,
      leadTimeDays,
      safetyStock,
      urgencyLevel,
      message,
      reason,
    };
  }

  async getAllAutoOrderMaterials(
    siteId?: string,
  ): Promise<AutoOrderRecommendation[]> {
    const filter: any = { status: 'active' };
    if (siteId && Types.ObjectId.isValid(siteId)) {
      const siteObjId = new Types.ObjectId(siteId);
      filter.$or = [{ siteId: siteObjId }, { assignedSites: siteObjId }];
    }

    const materials = await this.materialModel.find(filter).exec();
    const recommendations: AutoOrderRecommendation[] = [];

    for (const material of materials) {
      try {
        const rec = await this.checkAutoOrderNeeded(material._id.toString());
        if (rec.autoSuggestOrder) {
          recommendations.push(rec);
        }
      } catch {
        this.logger.warn(`Failed to check auto order for ${material._id}`);
      }
    }

    recommendations.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.urgencyLevel] - order[b.urgencyLevel];
    });

    return recommendations;
  }

  private getLeadTimeForMaterial(_material: Material): number {
    return this.DEFAULT_LEAD_TIME_DAYS;
  }

  private calculateSafetyStock(
    material: Material,
    consumptionRate: number,
  ): number {
    const dailyConsumption = consumptionRate * 24;
    const safetyStock = Math.ceil(dailyConsumption * this.SAFETY_STOCK_FACTOR);
    if (material.maximumStock > 0) {
      return Math.max(
        0,
        Math.min(safetyStock, material.maximumStock - material.quantity),
      );
    }
    return safetyStock;
  }

  async suggestSuppliers(
    materialId: string,
    siteCoordinates?: { latitude: number; longitude: number },
  ): Promise<SupplierSuggestion[]> {
    try {
      this.logger.log(
        `🔍 Recherche de fournisseurs pour matériau ${materialId} depuis MongoDB smartsite-fournisseurs`,
      );

      const material = await this.materialModel.findById(materialId).exec();
      if (!material) {
        this.logger.warn(`❌ Matériau ${materialId} non trouvé`);
        return [];
      }

      // S'assurer que la connexion MongoDB est établie
      if (!this.suppliersCollection) {
        await this.initializeSupplierConnection();
      }

      if (!this.suppliersCollection) {
        this.logger.error(
          '❌ Impossible de se connecter à MongoDB fournisseurs',
        );
        return this.getFallbackSuppliers();
      }

      // Récupérer tous les fournisseurs actifs depuis MongoDB
      const suppliers = await this.suppliersCollection
        .find({ $or: [{ isActive: true }, { isActive: { $exists: false } }] })
        .toArray();

      this.logger.log(
        `✅ ${suppliers.length} fournisseurs trouvés dans MongoDB smartsite-fournisseurs`,
      );

      if (suppliers.length === 0) {
        this.logger.warn('⚠️ Aucun fournisseur trouvé dans MongoDB');
        return this.getFallbackSuppliers();
      }

      // Convertir en format SupplierSuggestion
      const suggestions: SupplierSuggestion[] = suppliers.map((supplier) => {
        const suggestion: SupplierSuggestion = {
          supplierId: String(supplier._id) || 'unknown',
          supplierName: supplier.nom,
          estimatedDeliveryDays:
            supplier.delaiLivraison || this.DEFAULT_LEAD_TIME_DAYS,
          isPreferred: false, // TODO: Vérifier si dans material.preferredSuppliers
          telephone: supplier.telephone,
          email: supplier.email,
          adresse: supplier.adresse,
          ville: supplier.ville,
          specialites: supplier.specialites,
          evaluation: supplier.evaluation,
          coordonnees: supplier.coordonnees,
        };

        // Calculer la distance si les coordonnées du site et du fournisseur sont disponibles
        if (
          siteCoordinates &&
          supplier.coordonnees?.latitude &&
          supplier.coordonnees?.longitude
        ) {
          const distance = this.calculateDistance(
            siteCoordinates.latitude,
            siteCoordinates.longitude,
            supplier.coordonnees.latitude,
            supplier.coordonnees.longitude,
          );
          (suggestion as any).distance = Math.round(distance * 100) / 100; // Arrondir à 2 décimales
        }

        return suggestion;
      });

      // Trier par distance si disponible, sinon par évaluation
      if (siteCoordinates) {
        suggestions.sort((a, b) => {
          const distanceA = (a as any).distance || 999999;
          const distanceB = (b as any).distance || 999999;
          return distanceA - distanceB;
        });
        this.logger.log(
          `📍 Fournisseurs triés par distance depuis les coordonnées du site (${siteCoordinates.latitude}, ${siteCoordinates.longitude})`,
        );
      } else {
        suggestions.sort((a, b) => (b.evaluation || 0) - (a.evaluation || 0));
        this.logger.log('⭐ Fournisseurs triés par évaluation');
      }

      this.logger.log(
        `✅ ${suggestions.length} suggestions de fournisseurs générées depuis MongoDB`,
      );
      return suggestions.slice(0, 10); // Limiter à 10 fournisseurs
    } catch (error) {
      this.logger.error(
        `❌ Erreur lors de la récupération des fournisseurs depuis MongoDB:`,
        error,
      );
      return this.getFallbackSuppliers();
    }
  }

  // Calcul de distance en utilisant la formule de Haversine
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance en kilomètres
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private getFallbackSuppliers(): SupplierSuggestion[] {
    return [
      {
        supplierId: 'fallback-1',
        supplierName: 'Fournisseur par défaut (MongoDB non disponible)',
        estimatedDeliveryDays: this.DEFAULT_LEAD_TIME_DAYS,
        isPreferred: false,
        telephone: 'N/A',
        email: 'contact@default.com',
        adresse: 'Adresse non disponible',
        ville: 'Ville non disponible',
        specialites: ['Général'],
        evaluation: 3,
      },
    ];
  }

  // Propriété pour compatibilité avec le contrôleur
  public readonly suppliersService = {
    getSupplierCount: async (): Promise<number> => {
      try {
        if (!this.suppliersCollection) {
          await this.initializeSupplierConnection();
        }
        if (!this.suppliersCollection) return 0;

        return await this.suppliersCollection.countDocuments({
          $or: [{ isActive: true }, { isActive: { $exists: false } }],
        });
      } catch (error) {
        this.logger.error('Erreur lors du comptage des fournisseurs:', error);
        return 0;
      }
    },

    findAll: async (): Promise<SupplierDocument[]> => {
      try {
        if (!this.suppliersCollection) {
          await this.initializeSupplierConnection();
        }
        if (!this.suppliersCollection) return [];

        return await this.suppliersCollection
          .find({ $or: [{ isActive: true }, { isActive: { $exists: false } }] })
          .toArray();
      } catch (error) {
        this.logger.error(
          'Erreur lors de la récupération des fournisseurs:',
          error,
        );
        return [];
      }
    },
  };
}
