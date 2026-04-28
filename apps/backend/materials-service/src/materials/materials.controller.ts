import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto, UpdateStockDto } from './dto/update-material.dto';
import { MaterialQueryDto } from './dto/material-query.dto';
import { ScanQRDto } from './dto/scan-qr.dto';
import {
  MaterialForecast,
  StockAlert,
  QRScanResult,
} from './interfaces/material.interface';
import { QRScannerUtil } from '../common/utils/qr-scanner.util';
import * as fs from 'fs';
import { Material } from './entities/material.entity';
import { Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  StockPredictionService,
  StockPredictionResult,
} from './services/stock-prediction.service';
import { PredictionResult } from './dto/historical-data.dto';
import { MLTrainingService } from './services/ml-training.service';
import { IntelligentRecommendationService } from './services/intelligent-recommendation.service';
import { SitesService, SiteDocument } from '../sites/sites.service';
import { AnomalyEmailService } from '../common/email/anomaly-email.service';
import { AnomalyType } from './entities/material-flow-log.entity';
import { DailyReportService } from './services/daily-report.service';

@Controller('materials')
export class MaterialsController {
  private readonly logger = new Logger(MaterialsController.name);

  constructor(
    private readonly materialsService: MaterialsService,
    private readonly predictionService: StockPredictionService,
    private readonly mlTrainingService: MLTrainingService,
    private readonly intelligentRecommendationService: IntelligentRecommendationService,
    private readonly sitesService: SitesService,
    private readonly anomalyEmailService: AnomalyEmailService,
    private readonly dailyReportService: DailyReportService,
  ) {}

  /** Même contrat que StockPredictionService pour le front (Materials.tsx, PredictionsList). */
  private mapMlPredictionToClientFormat(
    material: Material,
    ml: PredictionResult,
  ): StockPredictionResult {
    const recommendedOrderQuantity =
      ml.recommendedOrderQuantity ??
      Math.max(
        0,
        Math.ceil(
          (ml.consumptionRate || 1) * 48 +
            (material.stockMinimum ?? 0) -
            material.quantity,
        ),
      );

    return {
      materialId: ml.materialId,
      materialName: material.name,
      currentStock: material.quantity,
      predictedStock: ml.predictedStock,
      consumptionRate: ml.consumptionRate,
      minimumStock: material.minimumStock,
      maximumStock: material.maximumStock,
      reorderPoint: material.stockMinimum,
      hoursToLowStock: ml.hoursToLowStock,
      hoursToOutOfStock: ml.hoursToOutOfStock,
      status: ml.status,
      recommendedOrderQuantity,
      predictionModelUsed: ml.modelTrained,
      confidence: ml.confidence,
      simulationData: [],
      message: ml.message,
    };
  }

  @Post()
  async create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.materialsService.create(createMaterialDto, null);
  }

  @Get()
  async findAll(@Query() query: MaterialQueryDto) {
    return this.materialsService.findAll(query);
  }

  @Get('dashboard')
  async getDashboard() {
    return this.materialsService.getDashboardStats();
  }

  @Get('alerts')
  async getAlerts(): Promise<StockAlert[]> {
    return this.materialsService.getStockAlerts();
  }

  @Get('predictions')
  async getPredictions() {
    return this.materialsService.getPredictionsForAllMaterials();
  }

  @Get('forecast/:id')
  async getForecast(@Param('id') id: string): Promise<MaterialForecast> {
    return this.materialsService.generateForecast(id);
  }

  @Get('movements/:id')
  async getMovements(@Param('id') id: string) {
    return this.materialsService.getStockMovements(id);
  }

  @Get('low-stock')
  async getLowStock() {
    return this.materialsService.getLowStockMaterials();
  }

  @Get('with-sites')
  async getMaterialsWithSites() {
    return this.materialsService.getMaterialsWithSiteInfo();
  }

  @Get('expiring')
  async getExpiringMaterials(@Query('days') days?: string) {
    const daysAhead = days ? parseInt(days, 10) : 30;
    return this.materialsService.getExpiringMaterials(daysAhead);
  }

  // ========== WEATHER ENDPOINT ==========
  @Get('weather')
  async getWeatherByCoordinates(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    try {
      if (!lat || !lng) {
        throw new BadRequestException('Coordonnées GPS manquantes (lat, lng)');
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        throw new BadRequestException('Coordonnées GPS invalides');
      }

      // Appeler directement l'API OpenWeatherMap
      const axios = require('axios');
      const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

      if (!OPENWEATHER_API_KEY) {
        this.logger.warn('⚠️ Clé API météo non configurée');
        return {
          success: false,
          weather: null,
          message: 'Clé API météo non configurée',
        };
      }

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=fr`;

      this.logger.log(
        `🌍 Fetching weather for coordinates: ${latitude}, ${longitude}`,
      );
      const response = await axios.get(url, { timeout: 5000 });

      if (!response?.data) {
        return { success: false, weather: null };
      }

      const weatherData = {
        temperature: Math.round(response.data.main.temp),
        feelsLike: Math.round(response.data.main.feels_like),
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        iconUrl: `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`,
        humidity: response.data.main.humidity,
        windSpeed: Math.round(response.data.wind.speed * 3.6), // m/s → km/h
        cityName: response.data.name,
        condition: this.mapWeatherCondition(response.data.weather[0].id),
      };

      this.logger.log(
        `✅ Weather fetched for coordinates (${latitude}, ${longitude}): ${weatherData.temperature}°C`,
      );
      return { success: true, weather: weatherData };
    } catch (error) {
      this.logger.error(`❌ Weather fetch failed: ${error.message}`);
      return { success: false, weather: null, error: error.message };
    }
  }

  private mapWeatherCondition(weatherId: number): string {
    if (weatherId >= 200 && weatherId < 300) return 'stormy';
    if (weatherId >= 300 && weatherId < 600) return 'rainy';
    if (weatherId >= 600 && weatherId < 700) return 'snowy';
    if (weatherId >= 700 && weatherId < 800) return 'windy';
    if (weatherId === 800) return 'sunny';
    if (weatherId > 800) return 'cloudy';
    return 'cloudy';
  }

  // ========== AI STOCK PREDICTION ==========
  @Get(['prediction/all', 'predictions/all'])
  async getAllPredictions() {
    const materials = await this.materialsService.findAll({ limit: 100 });
    const materialList = Array.isArray(materials)
      ? materials
      : (materials as any).data || [];

    const predictions = await Promise.all(
      materialList.map(async (material: any) => {
        try {
          // Use ML training service if historical data exists
          if (
            this.mlTrainingService.hasHistoricalData(material._id.toString())
          ) {
            const mlPrediction = await this.mlTrainingService.predictStock(
              material._id.toString(),
              24,
              material.quantity,
              material.reorderPoint,
            );
            return this.mapMlPredictionToClientFormat(material, mlPrediction);
          }

          // Fallback to stock prediction service
          return await this.predictionService.predictStockDepletion(
            material._id.toString(),
            material.name,
            material.quantity,
            material.minimumStock,
            material.maximumStock,
            material.stockMinimum,
            material.consumptionRate || 1,
          );
        } catch (error) {
          return null;
        }
      }),
    );

    return predictions.filter((p) => p !== null);
  }

  @Get(':id/prediction')
  async getStockPrediction(@Param('id') id: string) {
    const material = await this.materialsService.findOne(id);

    if (!material) {
      throw new BadRequestException('Matériau non trouvé');
    }

    // Use ML training service if historical data exists
    if (this.mlTrainingService.hasHistoricalData(id)) {
      const mlPrediction = await this.mlTrainingService.predictStock(
        id,
        24,
        material.quantity,
        material.stockMinimum,
      );
      return this.mapMlPredictionToClientFormat(material, mlPrediction);
    }

    // Fallback to stock prediction service
    return this.predictionService.predictStockDepletion(
      material._id.toString(),
      material.name,
      material.quantity,
      material.minimumStock,
      material.maximumStock,
      material.stockMinimum,
      material.consumptionRate || 1,
    );
  }

  @Get('auto-order/recommendations')
  async getAutoOrderRecommendations(@Query('siteId') siteId?: string) {
    return this.intelligentRecommendationService.getAllAutoOrderMaterials(
      siteId,
    );
  }

  @Get(':id/auto-order')
  async checkAutoOrder(@Param('id') id: string) {
    return this.intelligentRecommendationService.checkAutoOrderNeeded(id);
  }

  @Get('sites')
  async getSites() {
    try {
      this.logger.log(
        '🏗️ Récupération des sites depuis MongoDB smartsite/sites',
      );
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

  @Get('sites/test')
  async testSitesConnection(): Promise<any> {
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
          sites: sites.slice(0, 3).map((s) => ({
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

  @Get('sites/:id')
  async getSiteById(@Param('id') id: string) {
    try {
      this.logger.log(`🔍 Récupération du site ${id}`);
      const site = await this.sitesService.findOne(id);

      if (!site) {
        this.logger.warn(`⚠️ Site ${id} non trouvé`);
        return {
          success: false,
          message: 'Site non trouvé',
          data: null,
        };
      }

      this.logger.log(`✅ Site trouvé: ${site.nom}`);
      return site;
    } catch (error) {
      this.logger.error(`❌ Erreur récupération site ${id}:`, error);
      return {
        success: false,
        message: 'Erreur lors de la récupération du site',
        error: error.message,
        data: null,
      };
    }
  }
  @Get('suppliers/test')
  async testSuppliersConnection(): Promise<any> {
    try {
      this.logger.log('🧪 Test de connexion aux fournisseurs MongoDB...');
      const count =
        await this.intelligentRecommendationService.suppliersService.getSupplierCount();
      const suppliers =
        await this.intelligentRecommendationService.suppliersService.findAll();

      return {
        success: true,
        message: 'Connexion MongoDB fournisseurs OK',
        data: {
          database: 'smartsite-fournisseurs',
          collection: 'fournisseurs',
          totalSuppliers: count,
          suppliersFound: suppliers.length,
          suppliers: suppliers.slice(0, 3).map((s) => ({
            _id: s._id,
            nom: s.nom,
            ville: s.ville,
            specialites: s.specialites,
            delaiLivraison: s.delaiLivraison,
            evaluation: s.evaluation,
          })),
        },
      };
    } catch (error) {
      this.logger.error('❌ Erreur test fournisseurs:', error);
      return {
        success: false,
        message: 'Erreur de connexion MongoDB fournisseurs',
        error: error.message,
      };
    }
  }

  @Post('email/test')
  async testEmailAlert(
    @Body() testData?: { email?: string; materialName?: string },
  ): Promise<any> {
    try {
      this.logger.log("📧 Test d'envoi d'email d'alerte...");

      const testEmail =
        testData?.email || process.env.ADMIN_EMAIL || 'kacey8@ethereal.email';
      const materialName = testData?.materialName || 'Ciment Portland (Test)';

      await this.anomalyEmailService.sendStockAnomalyAlert({
        toEmail: testEmail,
        userName: 'Utilisateur Test',
        siteName: 'Chantier Test - Site Nord',
        materialName: materialName,
        materialCode: 'TEST001',
        flowType: 'OUT',
        quantity: 150,
        anomalyType: AnomalyType.EXCESSIVE_OUT,
        anomalyMessage:
          'Sortie excessive détectée : 150 unités sorties alors que la consommation normale est de 50 unités/jour. Risque de vol ou gaspillage.',
        currentStock: 50,
        previousStock: 200,
        expectedQuantity: 50,
        deviationPercent: 200,
        timestamp: new Date(),
        reason: "Test de l'envoi d'email d'alerte pour anomalie de stock",
      });

      this.logger.log(`✅ Email de test envoyé à ${testEmail}`);

      return {
        success: true,
        message: `Email de test envoyé avec succès à ${testEmail}`,
        info: 'Vérifiez votre boîte de réception Ethereal Email sur https://ethereal.email/messages',
        etherealUrl: 'https://ethereal.email/messages',
        credentials: {
          username: process.env.EMAIL_USER,
          note: "Connectez-vous sur https://ethereal.email avec ces identifiants pour voir l'email",
        },
      };
    } catch (error) {
      this.logger.error("❌ Erreur lors de l'envoi de l'email de test:", error);
      return {
        success: false,
        message: "Erreur lors de l'envoi de l'email de test",
        error: error.message,
      };
    }
  }

  @Get('suppliers')
  async getAllSuppliers(): Promise<any> {
    try {
      this.logger.log(
        '🏪 Récupération de tous les fournisseurs depuis MongoDB',
      );

      const suppliers =
        await this.intelligentRecommendationService.suppliersService.findAll();

      this.logger.log(
        `✅ ${suppliers.length} fournisseurs trouvés depuis MongoDB`,
      );

      return {
        success: true,
        data: suppliers,
        count: suppliers.length,
        message: `${suppliers.length} fournisseurs trouvés`,
        source: 'MongoDB smartsite-fournisseurs',
      };
    } catch (error) {
      this.logger.error(
        `❌ Erreur lors de la récupération des fournisseurs:`,
        error,
      );
      return {
        success: false,
        message: 'Erreur lors de la récupération des fournisseurs',
        data: [],
        count: 0,
        error: error.message,
      };
    }
  }

  @Get(':id/suppliers')
  async getSupplierSuggestions(
    @Param('id') materialId: string,
    @Query('siteLatitude') siteLatitude?: string,
    @Query('siteLongitude') siteLongitude?: string,
    @Query('siteId') siteId?: string,
  ) {
    try {
      this.logger.log(
        `🏪 Récupération des fournisseurs recommandés pour matériau ${materialId}`,
      );

      let siteCoordinates: { latitude: number; longitude: number } | undefined;

      // Récupérer les coordonnées du site si siteId est fourni
      if (siteId && !siteLatitude && !siteLongitude) {
        try {
          const site = await this.sitesService.findOne(siteId);
          if (site?.coordonnees?.latitude && site?.coordonnees?.longitude) {
            siteCoordinates = {
              latitude: site.coordonnees.latitude,
              longitude: site.coordonnees.longitude,
            };
            this.logger.log(
              `📍 Coordonnées du site ${siteId}: ${siteCoordinates.latitude}, ${siteCoordinates.longitude}`,
            );
          }
        } catch (error) {
          this.logger.warn(
            `⚠️ Impossible de récupérer les coordonnées du site ${siteId}:`,
            error.message,
          );
        }
      }

      // Récupérer les coordonnées du site si disponibles en paramètres
      if (siteLatitude && siteLongitude) {
        const lat = parseFloat(siteLatitude);
        const lon = parseFloat(siteLongitude);
        if (!isNaN(lat) && !isNaN(lon)) {
          siteCoordinates = { latitude: lat, longitude: lon };
          this.logger.log(
            `📍 Coordonnées du site (paramètres): ${lat}, ${lon}`,
          );
        }
      }

      // Récupérer les suggestions de fournisseurs depuis MongoDB
      const suppliers =
        await this.intelligentRecommendationService.suggestSuppliers(
          materialId,
          siteCoordinates,
        );

      this.logger.log(
        `✅ ${suppliers.length} fournisseurs recommandés trouvés depuis MongoDB`,
      );

      return {
        success: true,
        data: suppliers,
        count: suppliers.length,
        message: `${suppliers.length} fournisseurs recommandés trouvés`,
        source: 'MongoDB smartsite-fournisseurs',
        materialId: materialId,
        siteCoordinates: siteCoordinates,
        sortedBy: siteCoordinates ? 'distance' : 'evaluation',
      };
    } catch (error) {
      this.logger.error(
        `❌ Erreur lors de la récupération des fournisseurs recommandés:`,
        error,
      );
      return {
        success: false,
        message: 'Erreur lors de la récupération des fournisseurs recommandés',
        data: [],
        count: 0,
        error: error.message,
        materialId: materialId,
      };
    }
  }

  @Post('reports/daily/send')
  async sendDailyReport(@Body() body?: { email?: string }): Promise<any> {
    try {
      this.logger.log('📊 Déclenchement manuel du rapport quotidien...');

      const result = await this.dailyReportService.sendManualReport(
        body?.email,
      );

      if (result.success) {
        this.logger.log(`✅ ${result.message}`);
        return {
          success: true,
          message: result.message,
          timestamp: new Date().toISOString(),
        };
      } else {
        this.logger.error(`❌ ${result.message}`);
        return {
          success: false,
          message: result.message,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      this.logger.error(
        "❌ Erreur lors de l'envoi du rapport quotidien:",
        error,
      );
      return {
        success: false,
        message: `Erreur lors de l'envoi du rapport: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ========== DYNAMIC ROUTES (MUST BE LAST) ==========
  // Ces routes doivent être placées APRÈS toutes les routes spécifiques
  // pour éviter les conflits (ex: /materials/sites/:id capturé par /materials/:id)

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ) {
    return this.materialsService.update(id, updateMaterialDto, null);
  }

  @Put(':id/stock')
  async updateStock(
    @Param('id') id: string,
    @Body() updateStockDto: UpdateStockDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.materialsService.updateStock(id, updateStockDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.materialsService.remove(id);
  }

  @Post(':id/reorder')
  async reorder(@Param('id') id: string) {
    return this.materialsService.reorderMaterial(id, null);
  }

  @Get('search/barcode/:barcode')
  async findByBarcode(@Param('barcode') barcode: string) {
    return this.materialsService.findByBarcode(barcode);
  }

  @Get('search/qrcode/:qrCode')
  async findByQRCode(@Param('qrCode') qrCode: string) {
    return this.materialsService.findByQRCode(qrCode);
  }

  @Post('bulk')
  async bulkCreate(@Body() materials: CreateMaterialDto[]) {
    return this.materialsService.bulkCreate(materials, null);
  }

  @Post('scan-qr')
  @UseInterceptors(FileInterceptor('image'))
  async scanQRCode(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<QRScanResult> {
    if (!file) {
      throw new BadRequestException('Image requise pour le scan QR');
    }

    try {
      const qrData = await QRScannerUtil.scanFromImage(file.path);
      console.log('📸 QR Data scanné:', qrData);

      const parsedData = QRScannerUtil.parseQRData(qrData);
      console.log('📦 Données parsées:', parsedData);

      let material: Material | null = null;

      if (parsedData.id) {
        try {
          material = await this.materialsService.findOne(parsedData.id);
          console.log('✅ Matériau trouvé par ID:', material?.code);
        } catch (error) {
          console.log('❌ Matériau non trouvé par ID:', parsedData.id);
        }
      }

      if (!material && parsedData.code) {
        try {
          material = await this.materialsService.findByCode(parsedData.code);
          console.log('✅ Matériau trouvé par code:', material?.code);
        } catch (error) {
          console.log('❌ Matériau non trouvé par code:', parsedData.code);
        }
      }

      if (!material) {
        try {
          material = await this.materialsService.findByQRCode(qrData);
          console.log('✅ Matériau trouvé par QR code complet');
        } catch (error) {
          console.log('❌ Matériau non trouvé par QR code complet');
        }
      }

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        success: true,
        qrData,
        material,
      };
    } catch (error) {
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      console.error('❌ Erreur scan QR:', error);
      throw new BadRequestException(`Erreur scan QR: ${error.message}`);
    }
  }

  @Post('scan-qr-text')
  async scanQRCodeText(@Body() scanDto: ScanQRDto): Promise<QRScanResult> {
    if (!scanDto.qrCode) {
      throw new BadRequestException('QR code text requis');
    }

    const parsedData = QRScannerUtil.parseQRData(scanDto.qrCode);
    console.log('📦 Données parsées (texte):', parsedData);

    let material: Material | null = null;

    if (parsedData.id) {
      try {
        material = await this.materialsService.findOne(parsedData.id);
      } catch (error) {
        console.log('Matériau non trouvé par ID:', error.message);
      }
    }

    if (!material && parsedData.code) {
      try {
        material = await this.materialsService.findByCode(parsedData.code);
      } catch (error) {
        console.log('Matériau non trouvé par code:', error.message);
      }
    }

    if (!material) {
      try {
        material = await this.materialsService.findByQRCode(scanDto.qrCode);
      } catch (error) {
        console.log('Matériau non trouvé par QR code:', error.message);
      }
    }

    return {
      success: true,
      qrData: scanDto.qrCode,
      material,
    };
  }

  @Post(':id/generate-qr')
  async generateQRCode(@Param('id') id: string) {
    return this.materialsService.generateQRCode(id);
  }

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image requise');
    }

    const imageUrl = `/uploads/materials/${file.filename}`;
    return this.materialsService.addImage(id, imageUrl);
  }

  @Post('import/excel')
  @UseInterceptors(FileInterceptor('file'))
  async importFromExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Fichier Excel requis');
    }

    try {
      const result = await this.materialsService.importFromExcel(file.path);

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return result;
    } catch (error) {
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new BadRequestException(`Erreur import Excel: ${error.message}`);
    }
  }

  @Post('export/excel')
  async exportToExcel(@Res() res: Response, @Body() materialIds?: string[]) {
    const result = await this.materialsService.exportToExcel(materialIds);

    if (!result || !result.filePath) {
      throw new BadRequestException('Erreur export Excel');
    }

    return res.download(result.filePath, result.filename);
  }

  /*@Post('export/pdf')
  async exportToPDF(@Body() materialIds?: string[]) {
    return this.materialsService.exportToPDF(materialIds);
  }*/
  @Post('export/pdf')
  async exportToPDF(@Res() res: Response, @Body() materialIds?: string[]) {
    try {
      const result = await this.materialsService.exportToPDF(materialIds);

      if (!result || !result.filePath) {
        throw new BadRequestException('Erreur génération PDF');
      }

      const { filePath, filename } = result;

      return res.download(filePath, filename);
    } catch (error) {
      console.error('❌ Export PDF error:', error);
      throw new BadRequestException(error.message);
    }
  }

  // ========== ML TRAINING - UPLOAD CSV ==========
  @Post(':id/upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadHistoricalData(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('Aucun fichier CSV uploaded');
      }

      const material = await this.materialsService.findOne(id);
      if (!material) {
        throw new BadRequestException('Matériau non trouvé');
      }

      let csvContent: string;
      if (file.buffer && file.buffer.length > 0) {
        csvContent = file.buffer.toString('utf-8');
      } else if (file.path) {
        csvContent = require('fs').readFileSync(file.path, 'utf-8');
      } else {
        throw new BadRequestException('Impossible de lire le fichier');
      }

      console.log(
        '📄 CSV Content (first 200 chars):',
        csvContent.substring(0, 200),
      );

      const parsedData = this.mlTrainingService.parseCSV(csvContent, id);

      return {
        success: true,
        message: `CSV parsed successfully. ${parsedData.totalRecords} records loaded.`,
        data: {
          totalRecords: parsedData.totalRecords,
          dateRange: parsedData.dateRange,
          averageConsumption: parsedData.averageConsumption,
        },
      };
    } catch (error) {
      console.error('❌ Error uploading CSV:', error.message);
      throw new BadRequestException(`Error parsing CSV: ${error.message}`);
    }
  }

  // ========== ML TRAINING - TRAIN MODEL ==========
  @Post(':id/train')
  async trainModel(@Param('id') id: string) {
    const material = await this.materialsService.findOne(id);
    if (!material) {
      throw new BadRequestException('Matériau non trouvé');
    }

    const hasData = this.mlTrainingService.hasHistoricalData(id);
    if (!hasData) {
      throw new BadRequestException(
        'Aucune donnée historique. Upload CSV first.',
      );
    }

    const result = await this.mlTrainingService.trainModel(
      id,
      material.name,
      material.quantity,
      material.stockMinimum,
    );

    return {
      success: true,
      message: `Model trained successfully! Accuracy: ${(result.accuracy * 100).toFixed(1)}%`,
      trainingResult: result,
    };
  }

  // ========== ML PREDICTION ==========
  @Get(':id/predict')
  async predictStock(
    @Param('id') id: string,
    @Query('hours') hours: string = '24',
  ) {
    const material = await this.materialsService.findOne(id);
    if (!material) {
      throw new BadRequestException('Matériau non trouvé');
    }

    const hoursAhead = parseInt(hours, 10) || 24;

    const prediction = await this.mlTrainingService.predictStock(
      id,
      hoursAhead,
      material.quantity,
      material.stockMinimum,
    );

    prediction.materialName = material.name;

    return prediction;
  }

  // ========== ML MODEL INFO ==========
  @Get(':id/model-info')
  async getModelInfo(@Param('id') id: string) {
    const hasModel = this.mlTrainingService.hasModel(id);
    const hasData = this.mlTrainingService.hasHistoricalData(id);

    return {
      materialId: id,
      modelTrained: hasModel,
      hasHistoricalData: hasData,
      ...this.mlTrainingService.getModelInfo(id),
    };
  }

  // ========== ADVANCED PREDICTION ==========
  @Post(':id/predict-advanced')
  async predictAdvanced(
    @Param('id') id: string,
    @Body()
    features: {
      hourOfDay: number;
      dayOfWeek: number;
      siteActivityLevel: number;
      weather: string;
      projectType: string;
    },
  ) {
    const material = await this.materialsService.findOne(id);
    if (!material) {
      throw new BadRequestException('Matériau non trouvé');
    }

    const prediction = await this.mlTrainingService.predictStockAdvanced(
      id,
      {
        hourOfDay: features.hourOfDay,
        dayOfWeek: features.dayOfWeek,
        siteActivityLevel: features.siteActivityLevel,
        weather: features.weather,
        projectType: features.projectType,
      },
      material.quantity,
      material.stockMinimum,
    );

    prediction.materialName = material.name;
    prediction.currentStock = material.quantity;

    return prediction;
  }

  // ========== CONSUMPTION HISTORY ENDPOINTS (MUST BE BEFORE :id ROUTES) ==========
  @Get('consumption-history/export')
  async exportConsumptionHistory(
    @Query('materialId') materialId?: string,
    @Query('siteId') siteId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Res() res?: Response,
  ) {
    try {
      if (!res) {
        throw new BadRequestException('Response object is required');
      }

      const query: any = {};

      if (materialId) query.materialId = materialId;
      if (siteId) query.siteId = siteId;
      if (type) query.type = type;

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const entries = await this.materialsService.getConsumptionHistory(query);

      // Créer un fichier Excel
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Historique Consommation');

      // En-têtes
      worksheet.columns = [
        { header: 'Date', key: 'timestamp', width: 20 },
        { header: 'Matériau', key: 'materialName', width: 30 },
        { header: 'Code', key: 'materialCode', width: 15 },
        { header: 'Site', key: 'siteName', width: 25 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Quantité', key: 'quantity', width: 12 },
        { header: 'Utilisateur', key: 'userName', width: 20 },
        { header: 'Raison', key: 'reason', width: 30 },
        { header: 'Notes', key: 'notes', width: 40 },
      ];

      // Données
      entries.forEach((entry: any) => {
        worksheet.addRow({
          timestamp: new Date(
            entry.timestamp || entry.createdAt,
          ).toLocaleString('fr-FR'),
          materialName: entry.materialName,
          materialCode: entry.materialCode,
          siteName: entry.siteName,
          type: entry.type,
          quantity: entry.quantity,
          userName: entry.userName || '-',
          reason: entry.reason || '-',
          notes: entry.notes || '-',
        });
      });

      // Style
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };

      // Générer le buffer
      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=historique_consommation_${Date.now()}.xlsx`,
      );
      res.send(buffer);
    } catch (error) {
      this.logger.error(`❌ Export failed: ${error.message}`);
      if (res) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  @Get('consumption-history')
  async getConsumptionHistory(
    @Query('materialId') materialId?: string,
    @Query('siteId') siteId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
  ) {
    try {
      const query: any = {};

      if (materialId) query.materialId = materialId;
      if (siteId) query.siteId = siteId;
      if (type) query.type = type;

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      // Récupérer les entrées d'historique depuis le service
      const entries = await this.materialsService.getConsumptionHistory(query);

      return {
        success: true,
        entries,
        total: entries.length,
      };
    } catch (error) {
      this.logger.error(
        `❌ Consumption history fetch failed: ${error.message}`,
      );
      return {
        success: false,
        entries: [],
        error: error.message,
      };
    }
  }

  // ========== DYNAMIC ROUTES (MUST BE LAST) ==========
  // Ces routes doivent être placées APRÈS toutes les routes spécifiques
  // pour éviter les conflits (ex: /materials/sites/:id capturé par /materials/:id)
}
