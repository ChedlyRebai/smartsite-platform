import { Controller, Get, Query, Logger } from '@nestjs/common';
import { MaterialsService } from '../materials.service';

@Controller('materials/anomalies')
export class AnomaliesConsolidatedController {
  private readonly logger = new Logger(AnomaliesConsolidatedController.name);

  constructor(private readonly materialsService: MaterialsService) {}

  /**
   * Obtenir une vue consolidée des anomalies incluant:
   * - Anomalies ML (vol, gaspillage, surconsommation)
   * - Anomalies de flux (entrées/sorties excessives)
   * - Matériaux expirants
   * 
   * GET /api/materials/anomalies/consolidated?siteId=...&days=30
   */
  @Get('consolidated')
  async getConsolidatedAnomalies(
    @Query('siteId') siteId?: string,
    @Query('days') days: string = '30',
  ): Promise<any> {
    try {
      this.logger.log('\n🔍 [MATERIALS-SERVICE] CONSOLIDATED ANOMALIES REQUEST');
      this.logger.log('='.repeat(80));

      const daysNum = Number.parseInt(days, 10);

      // 1. Obtenir les anomalies ML (vol, gaspillage, surconsommation)
      const axios = require('axios');
      let mlAnomalies: any = {
        success: false,
        theft_risk: [],
        waste_risk: [],
        over_consumption: [],
      };

      try {
        const mlResponse = await axios.get(
          `http://localhost:3009/api/materials/anomalies/detect`,
          { timeout: 15000 },
        );
        mlAnomalies = mlResponse.data;
      } catch (error) {
        this.logger.warn(`⚠️ ML anomalies not available: ${error.message}`);
      }

      // 2. Obtenir les anomalies de flux (entrées/sorties excessives)
      let flowAnomalies: any = {
        summary: {
          totalMaterials: 0,
          materialsWithAnomalies: 0,
          criticalAnomalies: 0,
          warningAnomalies: 0,
        },
        anomaliesBySite: [],
      };

      try {
        const flowResponse = await axios.get(
          `http://localhost:3009/api/material-flow/analyze-anomalies`,
          {
            params: { siteId, days: daysNum },
            timeout: 10000,
          },
        );
        flowAnomalies = flowResponse.data;
      } catch (error) {
        this.logger.warn(`⚠️ Flow anomalies not available: ${error.message}`);
      }

      // 3. Obtenir les matériaux expirants
      const expiringMaterials = await this.materialsService.getExpiringMaterials(daysNum);

      // 4. Consolider les résultats
      const consolidated = {
        success: true,
        period: `${daysNum} days`,
        summary: {
          totalAnomalies: 0,
          criticalCount: 0,
          warningCount: 0,
          mlAnomalies: {
            theftRisk: mlAnomalies.theft_risk?.length || 0,
            wasteRisk: mlAnomalies.waste_risk?.length || 0,
            overConsumption: mlAnomalies.over_consumption?.length || 0,
          },
          flowAnomalies: {
            totalMaterials: flowAnomalies.summary?.totalMaterials || 0,
            materialsWithAnomalies: flowAnomalies.summary?.materialsWithAnomalies || 0,
            criticalAnomalies: flowAnomalies.summary?.criticalAnomalies || 0,
            warningAnomalies: flowAnomalies.summary?.warningAnomalies || 0,
          },
          expiringMaterials: expiringMaterials.length,
        },
        anomalies: {
          mlDetected: {
            theftRisk: mlAnomalies.theft_risk || [],
            wasteRisk: mlAnomalies.waste_risk || [],
            overConsumption: mlAnomalies.over_consumption || [],
          },
          flowAnalysis: flowAnomalies.anomaliesBySite || [],
          expiringMaterials: expiringMaterials.map(m => ({
            materialId: m._id.toString(),
            materialName: m.name,
            materialCode: m.code,
            expiryDate: m.expiryDate,
            daysToExpiry: Math.ceil((m.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            currentStock: m.quantity,
            siteId: m.siteId,
            severity: Math.ceil((m.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 7 ? 'critical' : 'high',
          })),
        },
      };

      // Calculer les totaux
      consolidated.summary.totalAnomalies =
        consolidated.summary.mlAnomalies.theftRisk +
        consolidated.summary.mlAnomalies.wasteRisk +
        consolidated.summary.mlAnomalies.overConsumption +
        consolidated.summary.flowAnomalies.materialsWithAnomalies +
        consolidated.summary.expiringMaterials;

      consolidated.summary.criticalCount =
        consolidated.summary.flowAnomalies.criticalAnomalies +
        expiringMaterials.filter(m => {
          const days = Math.ceil((m.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return days <= 7;
        }).length;

      consolidated.summary.warningCount =
        consolidated.summary.mlAnomalies.theftRisk +
        consolidated.summary.mlAnomalies.wasteRisk +
        consolidated.summary.flowAnomalies.warningAnomalies;

      this.logger.log('\n📊 [MATERIALS-SERVICE] CONSOLIDATED ANOMALIES RESULTS:');
      this.logger.log(`   ├─ Total Anomalies: ${consolidated.summary.totalAnomalies}`);
      this.logger.log(`   ├─ Critical: ${consolidated.summary.criticalCount}`);
      this.logger.log(`   ├─ Warning: ${consolidated.summary.warningCount}`);
      this.logger.log(`   ├─ ML Theft Risk: ${consolidated.summary.mlAnomalies.theftRisk}`);
      this.logger.log(`   ├─ ML Waste Risk: ${consolidated.summary.mlAnomalies.wasteRisk}`);
      this.logger.log(`   ├─ Flow Anomalies: ${consolidated.summary.flowAnomalies.materialsWithAnomalies}`);
      this.logger.log(`   └─ Expiring Materials: ${consolidated.summary.expiringMaterials}`);
      this.logger.log('='.repeat(80) + '\n');

      return consolidated;
    } catch (error) {
      this.logger.error(`❌ Error getting consolidated anomalies: ${error.message}`);
      this.logger.error(error.stack);
      return {
        success: false,
        message: `Error: ${error.message}`,
        summary: {
          totalAnomalies: 0,
          criticalCount: 0,
          warningCount: 0,
        },
        anomalies: {
          mlDetected: { theftRisk: [], wasteRisk: [], overConsumption: [] },
          flowAnalysis: [],
          expiringMaterials: [],
        },
      };
    }
  }
}
