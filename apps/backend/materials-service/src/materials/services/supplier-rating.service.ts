import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SupplierRating } from '../entities/supplier-rating.entity';
import { Material } from '../entities/material.entity';

export interface CreateRatingDto {
  materialId: string;
  supplierId: string;
  siteId: string;
  userId: string;
  userName: string;
  avis: 'POSITIF' | 'NEGATIF';
  note: number; // 1-5
  commentaire?: string;
  hasReclamation: boolean;
  reclamationMotif?: string;
  reclamationDescription?: string;
  consumptionPercentage: number;
}

export interface RatingStats {
  supplierId: string;
  supplierName: string;
  totalRatings: number;
  positifs: number;
  negatifs: number;
  averageNote: number;
  reclamations: number;
  tauxSatisfaction: number; // %
}

@Injectable()
export class SupplierRatingService {
  private readonly logger = new Logger(SupplierRatingService.name);

  constructor(
    @InjectModel(SupplierRating.name) private ratingModel: Model<SupplierRating>,
    @InjectModel(Material.name) private materialModel: Model<Material>,
  ) {}

  /**
   * 📝 Créer un rating pour un fournisseur
   */
  async createRating(createDto: CreateRatingDto): Promise<SupplierRating> {
    this.logger.log(`📝 Création rating: supplier=${createDto.supplierId}, avis=${createDto.avis}`);

    // Vérifier que le matériau existe
    const material = await this.materialModel.findById(createDto.materialId);
    if (!material) {
      throw new NotFoundException(`Matériau #${createDto.materialId} non trouvé`);
    }

    // Vérifier que la note est valide
    if (createDto.note < 1 || createDto.note > 5) {
      throw new BadRequestException('La note doit être entre 1 et 5');
    }

    // Vérifier si un rating existe déjà pour ce matériau/fournisseur/utilisateur
    const existing = await this.ratingModel.findOne({
      materialId: new Types.ObjectId(createDto.materialId),
      supplierId: new Types.ObjectId(createDto.supplierId),
      userId: new Types.ObjectId(createDto.userId),
    });

    if (existing) {
      // Mettre à jour le rating existant
      existing.avis = createDto.avis;
      existing.note = createDto.note;
      existing.commentaire = createDto.commentaire;
      existing.hasReclamation = createDto.hasReclamation;
      existing.reclamationMotif = createDto.reclamationMotif;
      existing.reclamationDescription = createDto.reclamationDescription;
      existing.consumptionPercentage = createDto.consumptionPercentage;
      existing.ratingDate = new Date();
      
      await existing.save();
      this.logger.log(`✅ Rating mis à jour: ${existing._id}`);
      return existing;
    }

    // Créer un nouveau rating
    const rating = new this.ratingModel({
      materialId: new Types.ObjectId(createDto.materialId),
      materialName: material.name,
      materialCode: material.code,
      supplierId: new Types.ObjectId(createDto.supplierId),
      supplierName: '', // Sera rempli par le frontend ou via API fournisseur
      siteId: new Types.ObjectId(createDto.siteId),
      siteName: '', // Sera rempli par le frontend ou via API site
      userId: new Types.ObjectId(createDto.userId),
      userName: createDto.userName,
      avis: createDto.avis,
      note: createDto.note,
      commentaire: createDto.commentaire,
      hasReclamation: createDto.hasReclamation,
      reclamationMotif: createDto.reclamationMotif,
      reclamationDescription: createDto.reclamationDescription,
      consumptionPercentage: createDto.consumptionPercentage,
      ratingDate: new Date(),
      status: createDto.hasReclamation ? 'PENDING' : 'REVIEWED',
    });

    await rating.save();
    this.logger.log(`✅ Rating créé: ${rating._id}`);
    return rating;
  }

  /**
   * 📊 Récupérer les statistiques d'un fournisseur
   */
  async getSupplierStats(supplierId: string): Promise<RatingStats> {
    const ratings = await this.ratingModel
      .find({ supplierId: new Types.ObjectId(supplierId) })
      .exec();

    if (ratings.length === 0) {
      return {
        supplierId,
        supplierName: '',
        totalRatings: 0,
        positifs: 0,
        negatifs: 0,
        averageNote: 0,
        reclamations: 0,
        tauxSatisfaction: 0,
      };
    }

    const positifs = ratings.filter(r => r.avis === 'POSITIF').length;
    const negatifs = ratings.filter(r => r.avis === 'NEGATIF').length;
    const reclamations = ratings.filter(r => r.hasReclamation).length;
    const totalNotes = ratings.reduce((sum, r) => sum + r.note, 0);
    const averageNote = totalNotes / ratings.length;
    const tauxSatisfaction = (positifs / ratings.length) * 100;

    return {
      supplierId,
      supplierName: ratings[0].supplierName,
      totalRatings: ratings.length,
      positifs,
      negatifs,
      averageNote: Math.round(averageNote * 10) / 10,
      reclamations,
      tauxSatisfaction: Math.round(tauxSatisfaction),
    };
  }

  /**
   * 📋 Récupérer tous les ratings d'un fournisseur
   */
  async getSupplierRatings(supplierId: string): Promise<SupplierRating[]> {
    return this.ratingModel
      .find({ supplierId: new Types.ObjectId(supplierId) })
      .sort({ ratingDate: -1 })
      .exec();
  }

  /**
   * 🚨 Récupérer toutes les réclamations
   */
  async getAllReclamations(status?: string): Promise<SupplierRating[]> {
    const query: any = { hasReclamation: true };
    if (status) {
      query.status = status;
    }

    return this.ratingModel
      .find(query)
      .sort({ ratingDate: -1 })
      .exec();
  }

  /**
   * ✅ Marquer une réclamation comme résolue
   */
  async resolveReclamation(ratingId: string): Promise<SupplierRating> {
    const rating = await this.ratingModel.findById(ratingId);
    if (!rating) {
      throw new NotFoundException(`Rating #${ratingId} non trouvé`);
    }

    rating.status = 'RESOLVED';
    await rating.save();

    this.logger.log(`✅ Réclamation résolue: ${ratingId}`);
    return rating;
  }

  /**
   * 🔍 Vérifier si un rating est nécessaire pour un matériau
   */
  async checkIfRatingNeeded(materialId: string, userId: string): Promise<{
    needed: boolean;
    consumptionPercentage: number;
    material?: Material;
    alreadyRated: boolean;
  }> {
    const material = await this.materialModel.findById(materialId);
    if (!material) {
      return { needed: false, consumptionPercentage: 0, alreadyRated: false };
    }

    // Calculer le % de consommation
    const totalInitial = (material.stockExistant || 0) + (material.stockEntree || 0);
    const consumptionPercentage = totalInitial > 0 
      ? Math.round(((material.stockSortie || 0) / totalInitial) * 100) 
      : 0;

    // Vérifier si déjà noté par cet utilisateur
    const existingRating = await this.ratingModel.findOne({
      materialId: new Types.ObjectId(materialId),
      userId: new Types.ObjectId(userId),
    });

    const alreadyRated = !!existingRating;

    // Rating nécessaire si consommation > 30% et pas encore noté
    const needed = consumptionPercentage > 30 && !alreadyRated;

    return {
      needed,
      consumptionPercentage,
      material: needed ? material : undefined,
      alreadyRated,
    };
  }

  /**
   * 📊 Récupérer les statistiques globales
   */
  async getGlobalStats(): Promise<{
    totalRatings: number;
    totalReclamations: number;
    averageNote: number;
    tauxSatisfactionGlobal: number;
    topSuppliers: Array<{ supplierId: string; supplierName: string; note: number }>;
  }> {
    const allRatings = await this.ratingModel.find().exec();

    if (allRatings.length === 0) {
      return {
        totalRatings: 0,
        totalReclamations: 0,
        averageNote: 0,
        tauxSatisfactionGlobal: 0,
        topSuppliers: [],
      };
    }

    const totalReclamations = allRatings.filter(r => r.hasReclamation).length;
    const totalNotes = allRatings.reduce((sum, r) => sum + r.note, 0);
    const averageNote = totalNotes / allRatings.length;
    const positifs = allRatings.filter(r => r.avis === 'POSITIF').length;
    const tauxSatisfactionGlobal = (positifs / allRatings.length) * 100;

    // Calculer le top 5 des fournisseurs
    const supplierMap = new Map<string, { name: string; notes: number[]; count: number }>();
    
    allRatings.forEach(rating => {
      const id = rating.supplierId.toString();
      if (!supplierMap.has(id)) {
        supplierMap.set(id, { name: rating.supplierName, notes: [], count: 0 });
      }
      const supplier = supplierMap.get(id)!;
      supplier.notes.push(rating.note);
      supplier.count++;
    });

    const topSuppliers = Array.from(supplierMap.entries())
      .map(([id, data]) => ({
        supplierId: id,
        supplierName: data.name,
        note: Math.round((data.notes.reduce((a, b) => a + b, 0) / data.count) * 10) / 10,
      }))
      .sort((a, b) => b.note - a.note)
      .slice(0, 5);

    return {
      totalRatings: allRatings.length,
      totalReclamations,
      averageNote: Math.round(averageNote * 10) / 10,
      tauxSatisfactionGlobal: Math.round(tauxSatisfactionGlobal),
      topSuppliers,
    };
  }
}
