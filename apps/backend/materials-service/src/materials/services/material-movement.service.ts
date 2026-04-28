import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Material } from '../entities/material.entity';
import { ConsumptionHistory, FlowType, AnomalyType, AnomalySeverity, SourceCollection } from '../entities/consumption-history.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface AddMovementDto {
  type: 'IN' | 'OUT';
  quantity: number;
  reason?: string;
  notes?: string;
  userId?: string;
}

export interface MovementResult {
  success: boolean;
  material: Material;
  movement: ConsumptionHistory;
  stockBefore: number;
  stockAfter: number;
  anomalyDetected: boolean;
  anomalyType?: string;
  message: string;
}

@Injectable()
export class MaterialMovementService {
  private readonly logger = new Logger(MaterialMovementService.name);

  // Seuils de détection d'anomalies
  private readonly SEUIL_GASPILLAGE = 1.5; // 150% de la moyenne
  private readonly SEUIL_VOL = 2.0; // 200% de la moyenne
  private readonly SEUIL_CRITIQUE = 3.0; // 300% de la moyenne

  constructor(
    @InjectModel(Material.name) private materialModel: Model<Material>,
    @InjectModel(ConsumptionHistory.name) private historyModel: Model<ConsumptionHistory>,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Ajoute un mouvement (Entrée ou Sortie) pour un matériau
   */
  async addMovement(materialId: string, movementDto: AddMovementDto): Promise<MovementResult> {
    this.logger.log(`📦 Ajout mouvement ${movementDto.type}: material=${materialId}, qty=${movementDto.quantity}`);

    // 1. Récupérer le matériau
    const material = await this.materialModel.findById(materialId);
    if (!material) {
      throw new NotFoundException(`Matériau #${materialId} non trouvé`);
    }

    // 2. Vérifier la quantité
    if (movementDto.quantity <= 0) {
      throw new BadRequestException('La quantité doit être supérieure à 0');
    }

    // 3. Calculer le stock avant
    const stockBefore = material.stockActuel || material.quantity || 0;

    // 4. Mettre à jour le stock selon le type de mouvement
    let stockAfter = stockBefore;
    if (movementDto.type === 'IN') {
      material.stockEntree = (material.stockEntree || 0) + movementDto.quantity;
      stockAfter = stockBefore + movementDto.quantity;
    } else {
      material.stockSortie = (material.stockSortie || 0) + movementDto.quantity;
      stockAfter = stockBefore - movementDto.quantity;
      
      // Vérifier qu'on ne va pas en négatif
      if (stockAfter < 0) {
        throw new BadRequestException(`Stock insuffisant. Stock actuel: ${stockBefore}, demandé: ${movementDto.quantity}`);
      }
    }

    // 5. Mettre à jour le stock actuel
    material.stockActuel = stockAfter;
    material.quantity = stockAfter; // Garder quantity synchronisé
    material.lastMovementDate = new Date();
    material.lastMovementType = movementDto.type;

    // 6. Vérifier si besoin de commander
    material.needsReorder = material.stockActuel < (material.stockMinimum || material.minimumStock || 0);

    // 7. Sauvegarder le matériau
    await material.save();

    // 8. Récupérer le nom du site
    let siteName = 'Chantier inconnu';
    if (material.siteId) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(`http://localhost:3001/api/gestion-sites/${material.siteId.toString()}`),
        );
        siteName = response.data?.nom || response.data?.name || siteName;
      } catch (error) {
        this.logger.warn(`Impossible de récupérer le site ${material.siteId}`);
      }
    }

    // 9. Créer l'entrée dans l'historique
    const historyEntry = new this.historyModel({
      materialId: material._id,
      materialName: material.name,
      materialCode: material.code,
      materialCategory: material.category,
      materialUnit: material.unit,
      siteId: material.siteId,
      siteName: siteName,
      date: new Date(),
      quantity: movementDto.quantity,
      flowType: movementDto.type === 'IN' ? FlowType.IN : FlowType.OUT,
      expectedQuantity: 0,
      anomalyScore: 0,
      anomalyType: AnomalyType.NONE,
      anomalySeverity: AnomalySeverity.NONE,
      stockBefore: stockBefore,
      stockAfter: stockAfter,
      sourceCollection: SourceCollection.DIRECT,
      sourceId: material._id,
      reason: movementDto.reason || (movementDto.type === 'IN' ? 'Entrée manuelle' : 'Sortie manuelle'),
      notes: movementDto.notes,
      recordedBy: movementDto.userId,
    });

    // 10. Détecter les anomalies pour les SORTIES
    let anomalyDetected = false;
    let anomalyType = '';
    
    if (movementDto.type === 'OUT') {
      const anomalyResult = await this.detectAnomaly(material, movementDto.quantity, historyEntry);
      anomalyDetected = anomalyResult.detected;
      anomalyType = anomalyResult.type;
    }

    // 11. Sauvegarder l'historique
    await historyEntry.save();

    this.logger.log(`✅ Mouvement enregistré: ${movementDto.type} ${movementDto.quantity} ${material.unit}, stock: ${stockBefore} → ${stockAfter}`);

    return {
      success: true,
      material,
      movement: historyEntry,
      stockBefore,
      stockAfter,
      anomalyDetected,
      anomalyType,
      message: `Mouvement ${movementDto.type === 'IN' ? 'entrée' : 'sortie'} enregistré avec succès`,
    };
  }

  /**
   * Détecte les anomalies de consommation
   */
  private async detectAnomaly(
    material: Material,
    quantity: number,
    historyEntry: ConsumptionHistory,
  ): Promise<{ detected: boolean; type: string }> {
    try {
      // Récupérer l'historique des 7 derniers jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentHistory = await this.historyModel
        .find({
          materialId: material._id,
          siteId: material.siteId,
          flowType: FlowType.OUT,
          date: { $gte: sevenDaysAgo },
        })
        .exec();

      if (recentHistory.length === 0) {
        // Pas assez d'historique pour détecter une anomalie
        return { detected: false, type: '' };
      }

      // Calculer la moyenne des sorties
      const totalQuantity = recentHistory.reduce((sum, entry) => sum + entry.quantity, 0);
      const average = totalQuantity / recentHistory.length;

      // Calculer l'écart
      const deviation = ((quantity - average) / average) * 100;

      this.logger.log(`📊 Analyse anomalie: qty=${quantity}, avg=${average.toFixed(2)}, deviation=${deviation.toFixed(1)}%`);

      // Détection selon les seuils
      if (quantity > average * this.SEUIL_CRITIQUE) {
        // 🚨 CRITIQUE: Vol probable (>300%)
        historyEntry.anomalyType = AnomalyType.THEFT;
        historyEntry.anomalySeverity = AnomalySeverity.CRITICAL;
        historyEntry.anomalyScore = 100;
        historyEntry.expectedQuantity = average;
        
        this.logger.warn(`🚨 VOL PROBABLE détecté: ${quantity} vs ${average.toFixed(1)} (${deviation.toFixed(1)}%)`);
        
        // TODO: Envoyer notification + email
        await this.sendCriticalAlert(material, quantity, average, deviation, 'VOL_PROBABLE');
        
        return { detected: true, type: 'VOL_PROBABLE' };
      } else if (quantity > average * this.SEUIL_VOL) {
        // ⚠️ DANGER: Gaspillage probable (>200%)
        historyEntry.anomalyType = AnomalyType.WASTE;
        historyEntry.anomalySeverity = AnomalySeverity.HIGH;
        historyEntry.anomalyScore = 80;
        historyEntry.expectedQuantity = average;
        
        this.logger.warn(`⚠️ GASPILLAGE détecté: ${quantity} vs ${average.toFixed(1)} (${deviation.toFixed(1)}%)`);
        
        // TODO: Envoyer notification
        await this.sendWarningAlert(material, quantity, average, deviation, 'GASPILLAGE');
        
        return { detected: true, type: 'GASPILLAGE' };
      } else if (quantity > average * this.SEUIL_GASPILLAGE) {
        // 📊 WARNING: Surconsommation (>150%)
        historyEntry.anomalyType = AnomalyType.OVER_CONSUMPTION;
        historyEntry.anomalySeverity = AnomalySeverity.MEDIUM;
        historyEntry.anomalyScore = 60;
        historyEntry.expectedQuantity = average;
        
        this.logger.log(`📊 SURCONSOMMATION: ${quantity} vs ${average.toFixed(1)} (${deviation.toFixed(1)}%)`);
        
        return { detected: true, type: 'SURCONSOMMATION' };
      }

      return { detected: false, type: '' };
    } catch (error) {
      this.logger.error(`❌ Erreur détection anomalie:`, error);
      return { detected: false, type: '' };
    }
  }

  /**
   * Envoie une alerte critique (vol probable)
   */
  private async sendCriticalAlert(
    material: Material,
    quantity: number,
    average: number,
    deviation: number,
    type: string,
  ): Promise<void> {
    try {
      // TODO: Implémenter l'envoi de notification
      this.logger.log(`🚨 ALERTE CRITIQUE: ${type} - ${material.name} (${quantity} vs ${average.toFixed(1)})`);
      
      // TODO: Implémenter l'envoi d'email
      // await this.emailService.sendCriticalAlert({...});
    } catch (error) {
      this.logger.error(`❌ Erreur envoi alerte critique:`, error);
    }
  }

  /**
   * Envoie une alerte d'avertissement (gaspillage)
   */
  private async sendWarningAlert(
    material: Material,
    quantity: number,
    average: number,
    deviation: number,
    type: string,
  ): Promise<void> {
    try {
      // TODO: Implémenter l'envoi de notification
      this.logger.log(`⚠️ ALERTE WARNING: ${type} - ${material.name} (${quantity} vs ${average.toFixed(1)})`);
    } catch (error) {
      this.logger.error(`❌ Erreur envoi alerte warning:`, error);
    }
  }

  /**
   * Récupère les mouvements récents d'un matériau
   */
  async getRecentMovements(materialId: string, days: number = 7): Promise<ConsumptionHistory[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.historyModel
      .find({
        materialId: new Types.ObjectId(materialId),
        date: { $gte: startDate },
      })
      .sort({ date: -1 })
      .limit(20)
      .exec();
  }
}
