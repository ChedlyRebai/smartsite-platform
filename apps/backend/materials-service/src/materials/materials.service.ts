import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Material } from './entities/material.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto, UpdateStockDto } from './dto/update-material.dto';
import { MaterialQueryDto } from './dto/material-query.dto';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Cron } from '@nestjs/schedule';
import { MaterialsGateway } from './materials.gateway';
import {
  StockMovement,
  StockAlert,
  MaterialForecast,
} from './interfaces/material.interface';
import { QRGeneratorUtil } from '../common/utils/qr-generator.util';
import * as path from 'path';
import * as fs from 'fs';
import { ImportExportService } from './services/import-export.service';
import { MaterialFlowService } from './services/material-flow.service';
import { MLTrainingEnhancedService } from './services/ml-training-enhanced.service';
import { FlowType } from './entities/material-flow-log.entity';

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);
  private readonly stockMovements: StockMovement[] = [];

  constructor(
    @InjectModel(Material.name) private materialModel: Model<Material>,
    private importExportService: ImportExportService,
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly materialsGateway: MaterialsGateway,
    @Inject(forwardRef(() => MaterialFlowService))
    private readonly materialFlowService: MaterialFlowService,
    private readonly mlTrainingService: MLTrainingEnhancedService,
  ) {}

  async create(
    createMaterialDto: CreateMaterialDto,
    userId: string | null,
  ): Promise<Material> {
    try {
      this.logger.log(`Création matériau avec code: ${createMaterialDto.code}`);

      const existing = await this.materialModel.findOne({
        code: createMaterialDto.code,
      });
      if (existing) {
        throw new BadRequestException(
          `Le code ${createMaterialDto.code} existe déjà`,
        );
      }

      this.validateStockLevels(createMaterialDto);

      const tempId = new Types.ObjectId();

      const qrResult = await QRGeneratorUtil.generateAndSaveQRCode(
        {
          id: tempId,
          code: createMaterialDto.code,
          name: createMaterialDto.name,
        },
        createMaterialDto.code,
      );

      const barcode = `MAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const dateKey = new Date().toISOString().replace(/\./g, '-');

      const materialData: any = {
        ...createMaterialDto,
        _id: tempId,
        qrCode: qrResult.dataURL,
        qrCodeImage: qrResult.url,
        barcode,
        priceHistory: { [dateKey]: 0 },
        status: 'active',
      };

      if (userId && Types.ObjectId.isValid(userId)) {
        materialData.createdBy = new Types.ObjectId(userId);
      } else {
        this.logger.warn(
          `⚠️ userId invalide ou manquant: ${userId}, création sans createdBy`,
        );
      }

      const material = new this.materialModel(materialData);
      const savedMaterial = await material.save();
      this.logger.log(`✅ Matériau créé avec ID: ${savedMaterial._id}`);
      this.logger.log(`✅ QR code sauvegardé: ${qrResult.url}`);

      this.materialsGateway.emitMaterialUpdate(
        'materialCreated',
        savedMaterial,
      );

      await this.cacheManager.del('materials_dashboard');
      await this.cacheManager.del('materials_alerts');

      // Enregistrer les mouvements dans material-flow-log si présents
      await this.recordFlowFromMaterialData(
        savedMaterial._id.toString(),
        createMaterialDto as any,
        userId || 'system',
      );

      return savedMaterial;
    } catch (error) {
      this.logger.error(`❌ Erreur création: ${error.message}`);
      throw error;
    }
  }

  async findAll(query: MaterialQueryDto): Promise<{
    data: Material[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        search,
        category,
        status,
        location,
        lowStock,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query;

      const filter: any = {};

      if (search) {
        filter.$text = { $search: search };
      }

      if (category) {
        filter.category = category;
      }

      if (status) {
        filter.status = status;
      }

      if (location) {
        filter.location = location;
      }

      if (lowStock !== undefined) {
        filter.$expr = { $lte: ['$quantity', '$stockMinimum'] };
      }

      const skip = (page - 1) * limit;
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [data, total] = await Promise.all([
        this.materialModel
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.materialModel.countDocuments(filter),
      ]);

      const mappedData = await Promise.all(
        data.map(async (material: any) => {
          const siteIdStr = material.siteId?.toString();

          let siteData: any = null;
          if (siteIdStr) {
            try {
              const siteResponse = await this.httpService.axiosRef.get(
                `http://localhost:3001/api/gestion-sites/${siteIdStr}`,
              );
              siteData = siteResponse.data;

              this.logger.log(
                `📍 Site ${siteIdStr}: ${siteData?.nom}, Coords: ${JSON.stringify(siteData?.coordinates)}`,
              );
            } catch (e) {
              this.logger.warn(`Could not fetch site ${siteIdStr}:`, e.message);
            }
          }

          // Extraire les coordonnées correctement (le champ s'appelle "coordinates" dans l'entité Site)
          let siteCoordinates: { lat: number; lng: number } | null = null;
          if (siteData?.coordinates?.lat && siteData?.coordinates?.lng) {
            siteCoordinates = {
              lat: siteData.coordinates.lat,
              lng: siteData.coordinates.lng,
            };
            this.logger.log(
              `✅ Coordonnées extraites: lat=${siteCoordinates.lat}, lng=${siteCoordinates.lng}`,
            );
          } else {
            this.logger.warn(
              `⚠️ Aucune coordonnée trouvée pour le site ${siteIdStr}`,
            );
          }

          return {
            ...material.toObject(),
            siteId: siteIdStr || '',
            siteName:
              siteData?.nom ||
              siteData?.name ||
              (siteIdStr ? 'Site assigné' : 'Non assigné'),
            siteAddress: siteData?.adresse || siteData?.address || '',
            siteCoordinates: siteCoordinates,
            stockMinimum: material.stockMinimum,
            needsReorder: material.quantity <= material.stockMinimum,
          };
        }),
      );

      return {
        data: mappedData,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`❌ Erreur recherche: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<Material> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de matériau invalide');
    }

    const material = await this.materialModel.findById(id).exec();
    if (!material) {
      throw new NotFoundException(`Matériau #${id} non trouvé`);
    }

    return material;
  }

  async findByCode(code: string): Promise<Material> {
    const material = await this.materialModel.findOne({ code }).exec();
    if (!material) {
      throw new NotFoundException(`Matériau avec code ${code} non trouvé`);
    }
    return material;
  }

  async update(
    id: string,
    updateMaterialDto: UpdateMaterialDto,
    userId: string | null,
  ): Promise<Material> {
    try {
      const material = await this.findOne(id);

      Object.assign(material, updateMaterialDto);

      const updated = await material.save();

      this.materialsGateway.emitMaterialUpdate('materialUpdated', updated);
      await this.cacheManager.del('materials_dashboard');

      // Enregistrer les mouvements dans material-flow-log si présents
      await this.recordFlowFromMaterialData(
        id,
        updateMaterialDto as any,
        userId || 'system',
      );

      return updated;
    } catch (error) {
      this.logger.error(`❌ Erreur mise à jour: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enregistrer les mouvements d'entrée/sortie dans material-flow-log avec détection d'anomalies
   */
  private async recordFlowFromMaterialData(
    materialId: string,
    data: any,
    userId: string,
  ): Promise<void> {
    try {
      const material = await this.findOne(materialId);
      const siteId = data.siteId || material.siteId?.toString();

      if (!siteId) {
        this.logger.warn(
          `⚠️ Pas de siteId pour enregistrer les mouvements du matériau ${materialId}`,
        );
        return;
      }

      if (!this.materialFlowService) {
        this.logger.warn(`⚠️ MaterialFlowService non disponible`);
        return;
      }

      // Enregistrer l'entrée si présente
      if (data.stockEntree && data.stockEntree > 0) {
        await this.materialFlowService.recordMovement(
          {
            materialId,
            siteId,
            type: 'IN' as any,
            quantity: data.stockEntree,
            reason: data.reason || 'Ajout de stock via formulaire',
            reference: data.reference,
          },
          userId,
        );
        this.logger.log(`✅ Entrée enregistrée: ${data.stockEntree} unités`);
      }

      // Enregistrer la sortie si présente ET détecter les anomalies
      if (data.stockSortie && data.stockSortie > 0) {
        await this.materialFlowService.recordMovement(
          {
            materialId,
            siteId,
            type: 'OUT' as any,
            quantity: data.stockSortie,
            reason: data.reason || 'Sortie de stock via formulaire',
            reference: data.reference,
          },
          userId,
        );
        this.logger.log(`✅ Sortie enregistrée: ${data.stockSortie} unités`);

        // 🚨 DÉTECTION D'ANOMALIES AUTOMATIQUE pour les sorties
        try {
          const anomalyResult =
            await this.mlTrainingService.detectConsumptionAnomaly(
              materialId,
              data.stockSortie,
            );

          if (anomalyResult.isAnomaly) {
            this.logger.warn(`🚨 ANOMALIE DÉTECTÉE: ${anomalyResult.message}`);

            // Émettre une alerte via WebSocket
            this.materialsGateway.emitMaterialUpdate('anomalyDetected', {
              materialId,
              materialName: material.name,
              anomalyResult,
              timestamp: new Date(),
            });
          }
        } catch (mlError) {
          this.logger.error(`❌ Erreur détection anomalie: ${mlError.message}`);
          // Ne pas faire échouer l'opération principale
        }
      }
    } catch (error) {
      this.logger.error(
        `❌ Erreur enregistrement mouvements: ${error.message}`,
      );
      // Ne pas faire échouer l'opération principale
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const material = await this.findOne(id);

      if (material.qrCodeImage) {
        const filename = path.basename(material.qrCodeImage);
        const imagePath = path.join(
          process.env.UPLOAD_PATH || './uploads/qrcodes',
          filename,
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          this.logger.log(`✅ Image QR code supprimée: ${imagePath}`);
        }
      }

      const result = await this.materialModel.deleteOne({ _id: id }).exec();
      if (result.deletedCount === 0) {
        throw new NotFoundException(`Matériau #${id} non trouvé`);
      }

      this.materialsGateway.emitMaterialUpdate('materialDeleted', { id });
      await this.cacheManager.del('materials_dashboard');
    } catch (error) {
      this.logger.error(`❌ Erreur suppression: ${error.message}`);
      throw error;
    }
  }

  async updateStock(
    id: string,
    updateStockDto: UpdateStockDto,
    userId: string | null,
  ) {
    try {
      const material = await this.findOne(id);
      const { quantity, operation, reason, projectId } = updateStockDto;

      const previousStock = material.quantity;
      let newStock = previousStock;
      let movementType: StockMovement['type'];
      let flowType: FlowType;

      switch (operation) {
        case 'add':
          newStock = previousStock + quantity;
          movementType = 'in';
          flowType = FlowType.IN;
          material.lastReceived = new Date();
          break;
        case 'remove':
          if (quantity > previousStock) {
            throw new BadRequestException('Stock insuffisant');
          }
          newStock = previousStock - quantity;
          movementType = 'out';
          flowType = FlowType.OUT;
          break;
        case 'reserve':
          material.reservedQuantity = (material.reservedQuantity || 0) + quantity;
          movementType = 'reserve';
          flowType = FlowType.RESERVE;
          newStock = previousStock;
          break;
        case 'damage':
          if (quantity > previousStock) {
            throw new BadRequestException('Stock insuffisant');
          }
          newStock = previousStock - quantity;
          material.damagedQuantity = (material.damagedQuantity || 0) + quantity;
          movementType = 'damage';
          flowType = FlowType.DAMAGE;
          break;
        default:
          throw new BadRequestException('Opération invalide');
      }

      material.quantity = newStock;
      material.lastCountDate = new Date();
      await material.save();

      // ========== ENREGISTRER LE MOUVEMENT DANS MATERIAL-FLOW-LOG ==========
      const siteId = material.siteId?.toString();
      if (siteId && this.materialFlowService) {
        try {
          await this.materialFlowService.recordMovement(
            {
              materialId: id,
              siteId,
              type: flowType,
              quantity,
              reason: reason || `Mise à jour de stock: ${operation}`,
              reference: undefined,
              projectId,
            },
            userId || 'system',
          );
          this.logger.log(
            `✅ Mouvement enregistré dans flow log: ${flowType} ${quantity} unités`,
          );
        } catch (flowError) {
          this.logger.error(
            `❌ Erreur enregistrement flow log: ${flowError.message}`,
          );
          // Ne pas faire échouer l'opération principale si l'enregistrement échoue
        }
      } else {
        this.logger.warn(
          `⚠️ Pas de siteId ou MaterialFlowService indisponible, mouvement non enregistré dans flow log`,
        );
      }

      const movement: StockMovement = {
        materialId: id,
        quantity,
        type: movementType,
        date: new Date(),
        userId: userId && Types.ObjectId.isValid(userId) ? userId : 'system',
        projectId,
        reason,
        previousStock,
        newStock,
      };

      this.stockMovements.push(movement);
      this.materialsGateway.emitStockUpdate(id, movement);
      await this.cacheManager.del('materials_dashboard');
      await this.cacheManager.del('materials_alerts');

      return { material, movement };
    } catch (error) {
      this.logger.error(`❌ Erreur mise à jour stock: ${error.message}`);
      throw error;
    }
  }

  async reorderMaterial(id: string, userId: string | null) {
    try {
      const material = await this.findOne(id);
      const orderQuantity =
        (material.maximumStock || material.minimumStock * 5) -
        material.quantity;

      this.logger.log(
        `🔄 Commande déclenchée pour ${material.name}: ${orderQuantity} ${material.unit}`,
      );

      material.reorderCount = (material.reorderCount || 0) + 1;
      material.lastOrdered = new Date();
      await material.save();

      return {
        success: true,
        orderId: `ORD-${Date.now()}`,
        material,
        orderQuantity,
        expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
    } catch (error) {
      this.logger.error(`❌ Erreur commande: ${error.message}`);
      throw error;
    }
  }

  async getLowStockMaterials(): Promise<Material[]> {
    return this.materialModel
      .find({
        $expr: { $lte: ['$quantity', '$stockMinimum'] },
      })
      .exec();
  }

  async getExpiringMaterials(days: number = 30): Promise<Material[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return this.materialModel
      .find({
        expiryDate: { $lte: targetDate, $gte: new Date() },
        status: 'active',
      })
      .sort({ expiryDate: 1 })
      .exec();
  }

  async getMaterialsWithSiteInfo() {
    const materials = await this.materialModel.find().exec();

    const result = await Promise.all(
      materials.map(async (material: any) => {
        const siteIdStr = material.siteId?.toString();

        let siteData: any = null;
        if (siteIdStr) {
          try {
            const axios = require('axios');
            const siteResponse = await axios.get(
              `http://localhost:3001/api/gestion-sites/${siteIdStr}`,
            );
            siteData = siteResponse.data;

            this.logger.log(
              `📍 Site ${siteIdStr}: ${siteData?.nom}, Coords: ${JSON.stringify(siteData?.coordinates)}`,
            );
          } catch (e) {
            this.logger.warn(`Could not fetch site ${siteIdStr}:`, e.message);
          }
        }

        // Extraire les coordonnées correctement (le champ s'appelle "coordinates" dans l'entité Site)
        let siteCoordinates: { lat: number; lng: number } | null = null;
        if (siteData?.coordinates?.lat && siteData?.coordinates?.lng) {
          siteCoordinates = {
            lat: siteData.coordinates.lat,
            lng: siteData.coordinates.lng,
          };
          this.logger.log(
            `✅ Coordonnées extraites: lat=${siteCoordinates.lat}, lng=${siteCoordinates.lng}`,
          );
        } else {
          this.logger.warn(
            `⚠️ Aucune coordonnée trouvée pour le site ${siteIdStr}`,
          );
        }

        return {
          _id: material._id,
          name: material.name,
          code: material.code,
          category: material.category,
          quantity: material.quantity,
          unit: material.unit,
          reorderPoint: material.stockMinimum,
          minimumStock: material.minimumStock,
          maximumStock: material.maximumStock,
          stockMinimum: material.stockMinimum,
          status: material.status,
          barcode: material.barcode,
          qrCode: material.qrCode,
          siteId: siteIdStr,
          siteName:
            siteData?.nom || (siteIdStr ? 'Site assigné' : 'Non assigné'),
          siteAddress: siteData?.adresse || '',
          siteCoordinates: siteCoordinates,
          needsReorder: material.quantity <= material.stockMinimum,
        };
      }),
    );

    return result;
  }

  async findByQRCode(qrCode: string): Promise<Material> {
    const material = await this.materialModel.findOne({ qrCode }).exec();
    if (!material) {
      throw new NotFoundException(`Matériau avec QR code non trouvé`);
    }
    return material;
  }

  async findByBarcode(barcode: string): Promise<Material> {
    const material = await this.materialModel.findOne({ barcode }).exec();
    if (!material) {
      throw new NotFoundException(
        `Matériau avec code-barres ${barcode} non trouvé`,
      );
    }
    return material;
  }

  async generateQRCode(
    id: string,
  ): Promise<{ qrCode: string; qrCodeImage: string; material: Material }> {
    try {
      const material = await this.findOne(id);

      if (material.qrCodeImage) {
        const oldFilename = path.basename(material.qrCodeImage);
        const oldPath = path.join(
          process.env.UPLOAD_PATH || './uploads/qrcodes',
          oldFilename,
        );
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
          this.logger.log(`✅ Ancienne image QR supprimée: ${oldPath}`);
        }
      }

      const qrResult = await QRGeneratorUtil.generateAndSaveQRCode(
        {
          id: material._id,
          code: material.code,
          name: material.name,
        },
        material.code,
      );

      material.qrCode = qrResult.dataURL;
      material.qrCodeImage = qrResult.url;
      await material.save();

      this.logger.log(
        `✅ QR code généré et sauvegardé pour ${material.code}: ${qrResult.url}`,
      );

      return {
        qrCode: qrResult.dataURL,
        qrCodeImage: qrResult.url,
        material,
      };
    } catch (error) {
      this.logger.error(`❌ Erreur génération QR: ${error.message}`);
      throw error;
    }
  }

  async getQRCodeImage(
    id: string,
  ): Promise<{ imagePath: string; filename: string }> {
    const material = await this.findOne(id);

    if (!material.qrCodeImage) {
      throw new NotFoundException(
        'Aucune image QR code trouvée pour ce matériau',
      );
    }

    const filename = path.basename(material.qrCodeImage);
    const imagePath = path.join(
      process.env.UPLOAD_PATH || './uploads/qrcodes',
      filename,
    );

    if (!fs.existsSync(imagePath)) {
      throw new NotFoundException(
        'Fichier image QR code non trouvé sur le serveur',
      );
    }

    return { imagePath, filename };
  }

  async addImage(id: string, imageUrl: string): Promise<Material> {
    try {
      const material = await this.findOne(id);

      if (!material.images) {
        material.images = [];
      }

      material.images.push(imageUrl);
      await material.save();

      return material;
    } catch (error) {
      this.logger.error(`❌ Erreur ajout image: ${error.message}`);
      throw error;
    }
  }

  async getDashboardStats() {
    try {
      const cacheKey = 'materials_dashboard';
      const cached = await this.cacheManager.get(cacheKey);

      if (cached) {
        return cached;
      }

      const [totalMaterials, lowStockCount, outOfStockCount, categoryStats] =
        await Promise.all([
          this.materialModel.countDocuments(),
          this.materialModel.countDocuments({
            $expr: { $lte: ['$quantity', '$stockMinimum'] },
          }),
          this.materialModel.countDocuments({ quantity: 0 }),
          this.materialModel.aggregate([
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                totalQuantity: { $sum: '$quantity' },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
          ]),
        ]);

      const stats = {
        totalMaterials,
        lowStockCount,
        outOfStockCount,
        healthyStockCount: totalMaterials - lowStockCount - outOfStockCount,
        categoryStats,
        recentMovements: this.getRecentStockMovements(10),
        timestamp: new Date(),
      };

      await this.cacheManager.set(cacheKey, stats, 300000);
      return stats;
    } catch (error) {
      this.logger.error(`❌ Erreur dashboard: ${error.message}`);
      throw error;
    }
  }

  async getStockAlerts(): Promise<StockAlert[]> {
    try {
      const cacheKey = 'materials_alerts';
      const cached = await this.cacheManager.get<StockAlert[]>(cacheKey);

      if (cached) {
        return cached;
      }

      const materials = await this.materialModel.find().exec();
      const alerts: StockAlert[] = [];

      for (const material of materials) {
        if (material.quantity <= material.stockMinimum) {
          alerts.push({
            materialId: material._id.toString(),
            materialName: material.name,
            currentQuantity: material.quantity,
            threshold: material.stockMinimum,
            type: material.quantity === 0 ? 'out_of_stock' : 'low_stock',
            severity: material.quantity === 0 ? 'high' : 'medium',
            message:
              material.quantity === 0
                ? `${material.name} est en rupture !`
                : `${material.name} est en dessous du seuil (${material.quantity}/${material.stockMinimum})`,
            date: new Date(),
          });
        }

        if (material.expiryDate) {
          const daysToExpiry = Math.ceil(
            (material.expiryDate.getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          );
          if (daysToExpiry <= 30 && daysToExpiry > 0) {
            alerts.push({
              materialId: material._id.toString(),
              materialName: material.name,
              currentQuantity: material.quantity,
              threshold: 30,
              type: 'expiring',
              severity: daysToExpiry <= 7 ? 'high' : 'medium',
              message: `${material.name} expire dans ${daysToExpiry} jours`,
              date: new Date(),
              expiryDate: material.expiryDate,
            });
          }
        }
      }

      await this.cacheManager.set(cacheKey, alerts, 60000);
      return alerts;
    } catch (error) {
      this.logger.error(`❌ Erreur alertes: ${error.message}`);
      throw error;
    }
  }

  async generateForecast(materialId: string): Promise<MaterialForecast> {
    try {
      const material = await this.findOne(materialId);
      const movements = this.getMaterialMovements(materialId);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentConsumption = movements
        .filter((m) => m.type === 'out' && new Date(m.date) >= thirtyDaysAgo)
        .reduce((sum, m) => sum + m.quantity, 0);

      const dailyConsumption = recentConsumption / 30 || 1;
      const daysRemaining = material.quantity / dailyConsumption;

      const reorderDate = new Date();
      reorderDate.setDate(
        reorderDate.getDate() + Math.floor(Math.max(daysRemaining * 0.7, 1)),
      );

      const suggestedOrderQuantity = Math.max(
        material.minimumStock * 2,
        Math.min(
          (material.maximumStock || material.minimumStock * 10) - material.quantity,
          dailyConsumption * 14,
        ),
      );

      const trends: { date: Date; consumption: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayMovements = movements
          .filter((m) => m.type === 'out' && new Date(m.date).toDateString() === date.toDateString())
          .reduce((sum, m) => sum + m.quantity, 0);
        trends.push({ date, consumption: dayMovements });
      }

      return {
        materialId,
        currentStock: material.quantity,
        dailyConsumption,
        daysRemaining: isFinite(daysRemaining) ? daysRemaining : 999,
        reorderDate,
        suggestedOrderQuantity,
        confidence: 0.85,
        trends,
      };
    } catch (error) {
      this.logger.error(`❌ Erreur prévision: ${error.message}`);
      throw error;
    }
  }

  async getPredictionsForAllMaterials(): Promise<any[]> {
    try {
      const materials = await this.materialModel.find({ status: 'active' }).lean();
      const predictions: any[] = [];

      for (const material of materials) {
        try {
          // Récupérer l'historique de consommation depuis ConsumptionHistory
          const ConsumptionHistory = this.materialModel.db.model('ConsumptionHistory');
          
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const recentEntries: any[] = await ConsumptionHistory.find({
            materialId: material._id.toString(),
            type: 'OUT',
            timestamp: { $gte: sevenDaysAgo },
          })
            .sort({ timestamp: -1 })
            .limit(100)
            .lean();

          // Calculer la consommation horaire moyenne
          let hourlyConsumption = 0;
          if (recentEntries.length > 0) {
            const totalConsumption = recentEntries.reduce((sum: number, entry: any) => sum + (entry.quantity || 0), 0);
            const oldestEntry = recentEntries[recentEntries.length - 1];
            const newestEntry = recentEntries[0];
            const hoursDiff = (new Date(newestEntry.timestamp).getTime() - new Date(oldestEntry.timestamp).getTime()) / (1000 * 60 * 60);
            
            if (hoursDiff > 0 && totalConsumption > 0) {
              hourlyConsumption = totalConsumption / hoursDiff;
            }
          }

          // Si pas d'historique récent, utiliser une estimation basée sur les mouvements de stock
          if (hourlyConsumption === 0) {
            const movements = this.getMaterialMovements(material._id.toString());
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentConsumption = movements
              .filter((m) => m.type === 'out' && new Date(m.date) >= thirtyDaysAgo)
              .reduce((sum, m) => sum + m.quantity, 0);
            
            if (recentConsumption > 0) {
              hourlyConsumption = recentConsumption / (30 * 24); // Convertir en consommation horaire
            }
          }

          // Calculer les heures restantes avant rupture
          let hoursRemaining = 0;
          let status = 'safe';
          let alertLevel = 'none';

          if (hourlyConsumption > 0 && material.quantity > 0) {
            hoursRemaining = material.quantity / hourlyConsumption;
            
            // Limiter à un maximum raisonnable (1 an = 8760 heures)
            if (hoursRemaining > 8760) {
              hoursRemaining = 8760;
              status = 'safe';
              alertLevel = 'none';
            } else if (hoursRemaining <= 24) {
              status = 'critical';
              alertLevel = 'high';
            } else if (hoursRemaining <= 72) {
              status = 'warning';
              alertLevel = 'medium';
            } else if (hoursRemaining <= 168) { // 7 jours
              status = 'attention';
              alertLevel = 'low';
            } else {
              status = 'safe';
              alertLevel = 'none';
            }
          } else if (material.quantity === 0) {
            // Stock épuisé
            hoursRemaining = 0;
            status = 'critical';
            alertLevel = 'high';
          } else {
            // Pas de consommation détectée
            hoursRemaining = 8760; // 1 an par défaut
            status = 'stable';
            alertLevel = 'none';
          }

          // Calculer la confiance basée sur le nombre de points de données
          let confidence = 0.5; // Par défaut
          if (recentEntries.length >= 20) {
            confidence = 0.9;
          } else if (recentEntries.length >= 10) {
            confidence = 0.8;
          } else if (recentEntries.length >= 5) {
            confidence = 0.7;
          } else if (recentEntries.length > 0) {
            confidence = 0.6;
          }

          predictions.push({
            materialId: material._id.toString(),
            materialCode: material.code,
            materialName: material.name,
            currentStock: material.quantity,
            minimumStock: material.minimumStock,
            hourlyConsumption: Math.round(hourlyConsumption * 100) / 100,
            hoursRemaining: Math.round(hoursRemaining * 10) / 10,
            daysRemaining: Math.round((hoursRemaining / 24) * 10) / 10,
            estimatedStockoutDate: hourlyConsumption > 0 && hoursRemaining < 8760
              ? new Date(Date.now() + hoursRemaining * 60 * 60 * 1000)
              : null,
            status,
            alertLevel,
            confidence,
            dataPoints: recentEntries.length,
          });
        } catch (error) {
          this.logger.warn(`⚠️ Erreur prédiction pour ${material.name}: ${error.message}`);
        }
      }

      // Trier par heures restantes (les plus critiques en premier)
      predictions.sort((a, b) => a.hoursRemaining - b.hoursRemaining);

      this.logger.log(`✅ Prédictions générées pour ${predictions.length} matériaux`);
      return predictions;
    } catch (error) {
      this.logger.error(`❌ Erreur génération prédictions: ${error.message}`);
      throw error;
    }
  }

  async bulkCreate(
    createMaterialDtos: CreateMaterialDto[],
    userId: string | null,
  ): Promise<Material[]> {
    try {
      const materials: any[] = [];

      for (const dto of createMaterialDtos) {
        const existing = await this.materialModel.findOne({ code: dto.code });
        if (existing) {
          throw new BadRequestException(`Le code ${dto.code} existe déjà`);
        }

        const tempId = new Types.ObjectId();
        const qrResult = await QRGeneratorUtil.generateAndSaveQRCode(
          {
            id: tempId,
            code: dto.code,
            name: dto.name,
          },
          dto.code,
        );

        const dateKey = new Date().toISOString().replace(/\./g, '-');

        const materialData: any = {
          ...dto,
          _id: tempId,
          qrCode: qrResult.dataURL,
          qrCodeImage: qrResult.url,
          barcode: `MAT-${Date.now()}-${Math.random()}`,
          priceHistory: { [dateKey]: 0 },
          status: 'active',
        };

        if (userId && Types.ObjectId.isValid(userId)) {
          materialData.createdBy = new Types.ObjectId(userId);
        }

        materials.push(materialData);
      }

      const created = await this.materialModel.insertMany(materials);

      this.logger.log(`✅ ${created.length} matériaux créés avec QR codes`);
      this.materialsGateway.emitMaterialUpdate('bulkCreated', {
        count: created.length,
      });
      await this.cacheManager.del('materials_dashboard');

      return created as Material[];
    } catch (error) {
      this.logger.error(`❌ Erreur création en masse: ${error.message}`);
      throw error;
    }
  }

  @Cron('0 * * * *')
  async checkLowStock() {
    this.logger.log('🔍 Vérification des stocks bas...');

    try {
      const lowStockMaterials = await this.getLowStockMaterials();

      for (const material of lowStockMaterials) {
        const alert: StockAlert = {
          materialId: material._id.toString(),
          materialName: material.name,
          currentQuantity: material.quantity,
          threshold: material.stockMinimum,
          type: 'low_stock',
          severity: material.quantity === 0 ? 'high' : 'medium',
          message: `${material.name} nécessite une commande (${material.quantity}/${material.stockMinimum})`,
          date: new Date(),
        };

        this.materialsGateway.emitAlert(alert);
      }

      this.logger.log(
        `✅ Vérification terminée: ${lowStockMaterials.length} matériaux en stock bas`,
      );
    } catch (error) {
      this.logger.error(`❌ Erreur vérification stocks bas: ${error.message}`);
    }
  }

  getStockMovements(materialId: string): StockMovement[] {
    return this.stockMovements.filter((m) => m.materialId === materialId);
  }

  getRecentStockMovements(limit: number): StockMovement[] {
    return this.stockMovements.slice(-limit);
  }

  private getMaterialMovements(materialId: string): StockMovement[] {
    return this.stockMovements.filter((m) => m.materialId === materialId);
  }

  private validateStockLevels(data: any) {
    if (data.minimumStock >= data.maximumStock) {
      throw new BadRequestException(
        'Le stock minimum doit être inférieur au stock maximum',
      );
    }
    if (
      data.stockMinimum &&
      (data.stockMinimum < data.minimumStock ||
        data.stockMinimum > data.maximumStock)
    ) {
      throw new BadRequestException(
        'Le point de commande doit être entre le stock minimum et maximum',
      );
    }
  }

  async importFromExcel(filePath: string): Promise<any> {
    try {
      const {
        ImportExportService,
      } = require('./services/import-export.service');
      const importExportService = new ImportExportService(this.materialModel);
      return await importExportService.importFromExcel(filePath);
    } catch (error) {
      this.logger.error(`❌ Erreur import Excel: ${error.message}`);
      throw new BadRequestException(
        `Erreur lors de l'import: ${error.message}`,
      );
    }
  }

  async exportToExcel(
    materialIds?: string[],
  ): Promise<{ filePath: string; filename: string }> {
    try {
      const {
        ImportExportService,
      } = require('./services/import-export.service');
      const importExportService = new ImportExportService(this.materialModel);
      return await importExportService.exportToExcel(materialIds);
    } catch (error) {
      this.logger.error(`❌ Erreur export Excel: ${error.message}`);
      throw new BadRequestException(
        `Erreur lors de l'export Excel: ${error.message}`,
      );
    }
  }

  async exportToPDF(
    materialIds?: string[],
  ): Promise<{ filePath: string; filename: string }> {
    try {
      const {
        ImportExportService,
      } = require('./services/import-export.service');
      const importExportService = new ImportExportService(this.materialModel);
      return await importExportService.exportToPDF(materialIds);
    } catch (error) {
      this.logger.error(`❌ Erreur export PDF: ${error.message}`);
      throw new BadRequestException(
        `Erreur lors de l'export PDF: ${error.message}`,
      );
    }
  }

  async getConsumptionHistory(query: any): Promise<any[]> {
    try {
      // Récupérer depuis ConsumptionHistory
      const ConsumptionHistory =
        this.materialModel.db.model('ConsumptionHistory');

      const entries = await ConsumptionHistory.find(query)
        .sort({ timestamp: -1, createdAt: -1 })
        .limit(1000)
        .lean()
        .exec();

      this.logger.log(`✅ Found ${entries.length} consumption history entries`);
      return entries;
    } catch (error) {
      this.logger.error(
        `❌ Error fetching consumption history: ${error.message}`,
      );
      return [];
    }
  }
}

