import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MaterialRequirement } from '../entities/material-requirement.entity';
import { Material } from '../entities/material.entity';
import { ConsumptionHistory, FlowType, AnomalyType, AnomalySeverity, SourceCollection } from '../entities/consumption-history.entity';
import { CreateMaterialRequirementDto, UpdateConsumptionDto, SiteConsumptionStats } from '../dto/material-requirement.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SiteConsumptionService {
  private readonly logger = new Logger(SiteConsumptionService.name);

  constructor(
    @InjectModel(MaterialRequirement.name) private requirementModel: Model<MaterialRequirement>,
    @InjectModel(Material.name) private materialModel: Model<Material>,
    @InjectModel(ConsumptionHistory.name) private consumptionHistoryModel: Model<ConsumptionHistory>,
    private readonly httpService: HttpService,
  ) {}

  async createRequirement(createDto: CreateMaterialRequirementDto, userId: string | null): Promise<MaterialRequirement> {
    const material = await this.materialModel.findById(createDto.materialId);
    if (!material) {
      throw new NotFoundException(`Materiau #${createDto.materialId} non trouve`);
    }

    const existing = await this.requirementModel.findOne({
      siteId: new Types.ObjectId(createDto.siteId),
      materialId: new Types.ObjectId(createDto.materialId),
    });

    if (existing) {
      throw new BadRequestException(`Une exigence existe deja pour ce materiau sur ce chantier`);
    }

    const requirement = new this.requirementModel({
      siteId: new Types.ObjectId(createDto.siteId),
      materialId: new Types.ObjectId(createDto.materialId),
      initialQuantity: createDto.initialQuantity,
      consumedQuantity: 0,
      remainingQuantity: createDto.initialQuantity,
      progressPercentage: 0,
      notes: createDto.notes,
      createdBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null,
    });

    const saved = await requirement.save();
    this.logger.log(`Exigence creee: site=${createDto.siteId}, material=${createDto.materialId}, quantite=${createDto.initialQuantity}`);
    return saved;
  }

  async updateConsumption(
    siteId: string,
    materialId: string,
    updateDto: UpdateConsumptionDto,
  ): Promise<MaterialRequirement> {
    const requirement = await this.requirementModel.findOne({
      siteId: new Types.ObjectId(siteId),
      materialId: new Types.ObjectId(materialId),
    }).populate('materialId');

    if (!requirement) {
      throw new NotFoundException(`Aucune exigence trouvee pour ce materiau sur ce chantier`);
    }

    if (updateDto.consumedQuantity > requirement.initialQuantity) {
      throw new BadRequestException(
        `La consommation (${updateDto.consumedQuantity}) ne peut pas depasser la quantite initiale (${requirement.initialQuantity})`,
      );
    }

    const material = requirement.materialId as any;
    const stockBefore = requirement.remainingQuantity;
    const quantityDiff = updateDto.consumedQuantity - requirement.consumedQuantity;

    requirement.consumedQuantity = updateDto.consumedQuantity;
    requirement.remainingQuantity = requirement.initialQuantity - updateDto.consumedQuantity;
    requirement.progressPercentage = requirement.initialQuantity > 0 ? (requirement.consumedQuantity / requirement.initialQuantity) * 100 : 0;
    requirement.lastUpdated = new Date();

    if (updateDto.notes) {
      requirement.notes = updateDto.notes;
    }

    const updated = await requirement.save();
    
    // 🔥 CRÉER UNE ENTRÉE DANS L'HISTORIQUE
    if (quantityDiff !== 0) {
      try {
        const historyEntry = new this.consumptionHistoryModel({
          materialId: new Types.ObjectId(materialId),
          materialName: material?.name || 'Inconnu',
          materialCode: material?.code || 'N/A',
          materialCategory: material?.category || 'N/A',
          materialUnit: material?.unit || 'unite',
          siteId: new Types.ObjectId(siteId),
          siteName: '',
          date: new Date(),
          quantity: Math.abs(quantityDiff),
          flowType: quantityDiff > 0 ? FlowType.OUT : FlowType.ADJUSTMENT,
          expectedQuantity: 0,
          anomalyScore: 0,
          anomalyType: AnomalyType.NONE,
          anomalySeverity: AnomalySeverity.NONE,
          stockBefore: stockBefore,
          stockAfter: requirement.remainingQuantity,
          sourceCollection: SourceCollection.DIRECT,
          sourceId: requirement._id,
          reason: updateDto.notes || 'Consommation mise à jour',
        });

        await historyEntry.save();
        this.logger.log(`✅ Historique créé: ${Math.abs(quantityDiff)} ${material?.unit} (mise à jour)`);
      } catch (error) {
        this.logger.error(`❌ Erreur création historique:`, error);
      }
    }
    
    this.logger.log(`Consommation mise a jour: site=${siteId}, material=${materialId}, progress=${updated.progressPercentage.toFixed(1)}%`);
    return updated;
  }

  async addConsumption(
    siteId: string,
    materialId: string,
    quantity: number,
    notes?: string,
  ): Promise<MaterialRequirement> {
    const requirement = await this.requirementModel.findOne({
      siteId: new Types.ObjectId(siteId),
      materialId: new Types.ObjectId(materialId),
    }).populate('materialId');

    if (!requirement) {
      throw new NotFoundException(`Aucune exigence trouvee pour ce materiau sur ce chantier`);
    }

    const material = requirement.materialId as any;
    const stockBefore = requirement.remainingQuantity;
    const newConsumed = requirement.consumedQuantity + quantity;

    if (newConsumed > requirement.initialQuantity) {
      throw new BadRequestException(
        `La consommation totale (${newConsumed}) depasserait la quantite initiale (${requirement.initialQuantity})`,
      );
    }

    requirement.consumedQuantity = newConsumed;
    requirement.remainingQuantity = requirement.initialQuantity - newConsumed;
    requirement.progressPercentage = requirement.initialQuantity > 0 ? (requirement.consumedQuantity / requirement.initialQuantity) * 100 : 0;
    requirement.lastUpdated = new Date();

    if (notes) {
      requirement.notes = requirement.notes ? `${requirement.notes}\n${notes}` : notes;
    }

    const updated = await requirement.save();
    
    // 🔥 CRÉER UNE ENTRÉE DANS L'HISTORIQUE
    try {
      const historyEntry = new this.consumptionHistoryModel({
        materialId: new Types.ObjectId(materialId),
        materialName: material?.name || 'Inconnu',
        materialCode: material?.code || 'N/A',
        materialCategory: material?.category || 'N/A',
        materialUnit: material?.unit || 'unite',
        siteId: new Types.ObjectId(siteId),
        siteName: '', // Sera rempli si disponible
        date: new Date(),
        quantity: quantity,
        flowType: FlowType.OUT, // Consommation = sortie
        expectedQuantity: 0,
        anomalyScore: 0,
        anomalyType: AnomalyType.NONE,
        anomalySeverity: AnomalySeverity.NONE,
        stockBefore: stockBefore,
        stockAfter: requirement.remainingQuantity,
        sourceCollection: SourceCollection.DIRECT,
        sourceId: requirement._id,
        reason: notes || 'Consommation ajoutée',
      });

      await historyEntry.save();
      this.logger.log(`✅ Historique créé: ${quantity} ${material?.unit} consommé(s) sur site ${siteId}`);
    } catch (error) {
      this.logger.error(`❌ Erreur création historique:`, error);
      // Ne pas bloquer l'opération si l'historique échoue
    }
    
    this.logger.log(`+${quantity} consomme: site=${siteId}, material=${materialId}, nouveau total=${updated.consumedQuantity}`);
    return updated;
  }

  async getRequirementsBySite(siteId: string): Promise<any[]> {
    const requirements = await this.requirementModel
      .find({ siteId: new Types.ObjectId(siteId) })
      .populate('materialId')
      .sort({ createdAt: -1 })
      .exec();

    return requirements.map((req) => {
      const material = req.materialId as any;
      return {
        _id: req._id,
        siteId: req.siteId,
        materialId: req.materialId,
        materialName: material?.name || 'Inconnu',
        materialCode: material?.code || 'N/A',
        materialCategory: material?.category || 'N/A',
        materialUnit: material?.unit || 'unite',
        initialQuantity: req.initialQuantity,
        consumedQuantity: req.consumedQuantity,
        remainingQuantity: req.remainingQuantity,
        progressPercentage: req.progressPercentage,
        lastUpdated: req.lastUpdated,
        notes: req.notes,
      };
    });
  }

  async getSiteConsumptionStats(siteId: string, siteName?: string): Promise<SiteConsumptionStats> {
    const requirements = await this.getRequirementsBySite(siteId);

    const totalInitial = requirements.reduce((sum, r) => sum + r.initialQuantity, 0);
    const totalConsumed = requirements.reduce((sum, r) => sum + r.consumedQuantity, 0);
    const totalRemaining = requirements.reduce((sum, r) => sum + r.remainingQuantity, 0);

    let overallProgress = 0;
    if (totalInitial > 0) {
      overallProgress = (totalConsumed / totalInitial) * 100;
    }

    return {
      siteId,
      siteName: siteName || `Site ${siteId}`,
      totalInitialQuantity: totalInitial,
      totalConsumedQuantity: totalConsumed,
      totalRemainingQuantity: totalRemaining,
      overallProgress: Math.round(overallProgress * 10) / 10,
      materialsCount: requirements.length,
      materials: requirements,
    };
  }

  async getAllRequirementsWithSites(): Promise<any[]> {
    const requirements = await this.requirementModel
      .find()
      .populate('materialId')
      .sort({ lastUpdated: -1 })
      .exec();

    const enriched = await Promise.all(requirements.map(async (req) => {
      const material = req.materialId as any;

      let siteName = 'Chantier inconnu';
      try {
        const response = await firstValueFrom(
          this.httpService.get(`http://localhost:3001/api/gestion-sites/${req.siteId.toString()}`),
        );
        siteName = response.data?.nom || response.data?.name || siteName;
      } catch (error) {
        this.logger.warn(`Impossible de recuperer le site ${req.siteId}`);
      }

      return {
        _id: req._id,
        siteId: req.siteId,
        siteName,
        materialId: req.materialId,
        materialName: material?.name || 'Inconnu',
        materialCode: material?.code || 'N/A',
        materialCategory: material?.category || 'N/A',
        materialUnit: material?.unit || 'unite',
        initialQuantity: req.initialQuantity,
        consumedQuantity: req.consumedQuantity,
        remainingQuantity: req.remainingQuantity,
        progressPercentage: req.progressPercentage,
        lastUpdated: req.lastUpdated,
        notes: req.notes,
      };
    }));

    return enriched;
  }

  async getHighConsumptionMaterials(threshold: number = 80): Promise<any[]> {
    const requirements = await this.requirementModel
      .find({ progressPercentage: { $gte: threshold } })
      .populate('materialId')
      .exec();

    return requirements.map((req) => {
      const material = req.materialId as any;
      return {
        _id: req._id,
        siteId: req.siteId,
        materialId: req.materialId,
        materialName: material?.name || 'Inconnu',
        materialCode: material?.code || 'N/A',
        initialQuantity: req.initialQuantity,
        consumedQuantity: req.consumedQuantity,
        remainingQuantity: req.remainingQuantity,
        progressPercentage: req.progressPercentage,
      };
    });
  }

  async deleteRequirement(siteId: string, materialId: string): Promise<void> {
    const result = await this.requirementModel.deleteOne({
      siteId: new Types.ObjectId(siteId),
      materialId: new Types.ObjectId(materialId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Aucune exigence trouvee pour ce materiau sur ce chantier`);
    }

    this.logger.log(`Exigence supprimee: site=${siteId}, material=${materialId}`);
  }

  async getRequirement(siteId: string, materialId: string): Promise<MaterialRequirement | null> {
    return this.requirementModel.findOne({
      siteId: new Types.ObjectId(siteId),
      materialId: new Types.ObjectId(materialId),
    }).exec();
  }
}
