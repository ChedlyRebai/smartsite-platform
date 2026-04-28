import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Material } from '../entities/material.entity';
import {
  MaterialFlowLog,
  AnomalyType,
} from '../entities/material-flow-log.entity';
import { AnomalyEmailService } from '../../common/email/anomaly-email.service';
import {
  IntelligentRecommendationService,
  AutoOrderRecommendation,
} from './intelligent-recommendation.service';

interface DailyReportData {
  date: string;
  totalActiveMaterials: number;
  lowStockMaterials: Array<{
    name: string;
    code: string;
    currentQuantity: number;
    minimumStock: number;
    siteName?: string;
  }>;
  outOfStockMaterials: Array<{
    name: string;
    code: string;
    siteName?: string;
  }>;
  expiringMaterials: Array<{
    name: string;
    code: string;
    expiryDate: string;
    daysRemaining: number;
    siteName?: string;
  }>;
  anomalies: Array<{
    materialName: string;
    materialCode: string;
    anomalyType: string;
    message: string;
    timestamp: string;
    siteName?: string;
  }>;
  ordersInTransit: Array<{
    materialName: string;
    materialCode: string;
    status: string;
    progress: string;
    siteName?: string;
  }>;
  criticalRecommendations: Array<{
    materialName: string;
    materialCode: string;
    urgencyLevel: string;
    message: string;
    recommendedQuantity: number;
    siteName?: string;
  }>;
}

@Injectable()
export class DailyReportService {
  private readonly logger = new Logger(DailyReportService.name);

  constructor(
    @InjectModel(Material.name) private materialModel: Model<Material>,
    @InjectModel(MaterialFlowLog.name)
    private flowLogModel: Model<MaterialFlowLog>,
    private configService: ConfigService,
    private anomalyEmailService: AnomalyEmailService,
    private intelligentRecommendationService: IntelligentRecommendationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async sendDailyReport(): Promise<void> {
    const isEnabled =
      this.configService.get<string>('DAILY_REPORT_ENABLED') === 'true';
    if (!isEnabled) {
      this.logger.log(
        '📊 Rapport quotidien désactivé (DAILY_REPORT_ENABLED=false)',
      );
      return;
    }

    const reportEmail = this.configService.get<string>('DAILY_REPORT_EMAIL');
    if (!reportEmail) {
      this.logger.warn(
        '⚠️ DAILY_REPORT_EMAIL non configuré, rapport non envoyé',
      );
      return;
    }

    try {
      this.logger.log('📊 Génération du rapport quotidien automatique...');
      const reportData = await this.generateReportData();
      await this.sendReportEmail(reportEmail, reportData);
      this.logger.log('✅ Rapport quotidien envoyé avec succès');
    } catch (error) {
      this.logger.error(
        "❌ Erreur lors de l'envoi du rapport quotidien:",
        error,
      );
    }
  }

  async sendManualReport(
    email?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const reportEmail =
        email || this.configService.get<string>('DAILY_REPORT_EMAIL');
      if (!reportEmail) {
        return {
          success: false,
          message: 'Email de destination non spécifié',
        };
      }

      this.logger.log(
        `📊 Génération du rapport quotidien manuel pour ${reportEmail}...`,
      );
      const reportData = await this.generateReportData();
      await this.sendReportEmail(reportEmail, reportData);

      return {
        success: true,
        message: `Rapport quotidien envoyé avec succès à ${reportEmail}`,
      };
    } catch (error) {
      this.logger.error("❌ Erreur lors de l'envoi du rapport manuel:", error);
      return {
        success: false,
        message: `Erreur lors de l'envoi: ${error.message}`,
      };
    }
  }

  private async generateReportData(): Promise<DailyReportData> {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // 1. Nombre total de matériaux actifs
    const totalActiveMaterials = await this.materialModel.countDocuments({
      status: 'active',
    });

    // 2. Matériaux en stock bas (quantity < minimumStock)
    const lowStockMaterials = await this.materialModel
      .find({
        status: 'active',
        $expr: { $lt: ['$quantity', '$minimumStock'] },
        quantity: { $gt: 0 },
      })
      .select('name code quantity minimumStock siteName')
      .exec();

    // 3. Matériaux en rupture (quantity = 0)
    const outOfStockMaterials = await this.materialModel
      .find({
        status: 'active',
        quantity: 0,
      })
      .select('name code siteName')
      .exec();

    // 4. Matériaux expirant dans les 7 prochains jours
    const sevenDaysFromNow = new Date(
      today.getTime() + 7 * 24 * 60 * 60 * 1000,
    );
    const expiringMaterials = await this.materialModel
      .find({
        status: 'active',
        expiryDate: { $lte: sevenDaysFromNow, $gte: today },
      })
      .select('name code expiryDate siteName')
      .exec();

    // 5. Anomalies détectées dans les dernières 24h
    const anomalies = await this.flowLogModel
      .find({
        timestamp: { $gte: yesterday },
        anomalyDetected: { $ne: AnomalyType.NONE },
      })
      .populate('materialId', 'name code')
      .select('anomalyDetected anomalyMessage timestamp')
      .sort({ timestamp: -1 })
      .limit(20)
      .exec();

    // 6. Commandes en cours (simulé - à adapter selon votre système de commandes)
    const ordersInTransit = []; // TODO: Implémenter selon votre système de commandes

    // 7. Recommandations urgentes (urgencyLevel = critical)
    const criticalRecommendations =
      await this.intelligentRecommendationService.getAllAutoOrderMaterials();
    const urgentRecommendations = criticalRecommendations.filter(
      (rec) => rec.urgencyLevel === 'critical',
    );

    return {
      date: today.toLocaleDateString('fr-FR'),
      totalActiveMaterials,
      lowStockMaterials: lowStockMaterials.map((material) => ({
        name: material.name,
        code: material.code,
        currentQuantity: material.quantity,
        minimumStock: material.minimumStock,
        siteName: (material as any).siteName || 'Non assigné',
      })),
      outOfStockMaterials: outOfStockMaterials.map((material) => ({
        name: material.name,
        code: material.code,
        siteName: (material as any).siteName || 'Non assigné',
      })),
      expiringMaterials: expiringMaterials.map((material) => {
        const daysRemaining = Math.ceil(
          (material.expiryDate.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        return {
          name: material.name,
          code: material.code,
          expiryDate: material.expiryDate.toLocaleDateString('fr-FR'),
          daysRemaining,
          siteName: (material as any).siteName || 'Non assigné',
        };
      }),
      anomalies: anomalies.map((anomaly) => ({
        materialName: (anomaly as any).materialId?.name || 'Matériau inconnu',
        materialCode: (anomaly as any).materialId?.code || 'N/A',
        anomalyType: this.getAnomalyTypeLabel(anomaly.anomalyDetected),
        message: anomaly.anomalyMessage || 'Anomalie détectée',
        timestamp: anomaly.timestamp.toLocaleString('fr-FR'),
        siteName: 'Site non spécifié', // TODO: Récupérer depuis siteId
      })),
      ordersInTransit,
      criticalRecommendations: urgentRecommendations.map((rec) => ({
        materialName: rec.materialName,
        materialCode: rec.materialCode,
        urgencyLevel: rec.urgencyLevel,
        message: rec.message,
        recommendedQuantity: rec.recommendedQuantity,
        siteName: 'Site non spécifié', // TODO: Récupérer depuis le matériau
      })),
    };
  }

  private async sendReportEmail(
    email: string,
    reportData: DailyReportData,
  ): Promise<void> {
    const subject = `[SmartSite] Rapport quotidien matériaux — ${reportData.date}`;
    const html = this.generateReportHtml(reportData);

    // Utiliser le service d'email existant avec une méthode adaptée
    await this.sendDailyReportEmail(email, subject, html);
  }

  private async sendDailyReportEmail(
    email: string,
    subject: string,
    html: string,
  ): Promise<void> {
    // Créer un transporteur temporaire pour le rapport quotidien
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransporter({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });

    const smtpFrom =
      this.configService.get<string>('SMTP_FROM') ||
      `"SmartSite Rapport" <${this.configService.get<string>('SMTP_USER')}>`;

    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject,
      html,
    });

    this.logger.log(`✅ Rapport quotidien envoyé à ${email}`);
  }

  private generateReportHtml(data: DailyReportData): string {
    const getSeverityColor = (count: number) => {
      if (count === 0) return '#10b981'; // Vert
      if (count <= 3) return '#f59e0b'; // Orange
      return '#dc2626'; // Rouge
    };

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartSite - Rapport Quotidien</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f6f9; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #0c1929 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; }
    .summary-number { font-size: 2rem; font-weight: bold; margin-bottom: 5px; }
    .summary-label { color: #64748b; font-size: 0.9rem; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 1.2rem; font-weight: 600; color: #1e293b; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
    .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .table th { background: #f1f5f9; font-weight: 600; color: #475569; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
    .badge-critical { background: #fecaca; color: #991b1b; }
    .badge-warning { background: #fed7aa; color: #9a3412; }
    .badge-success { background: #bbf7d0; color: #166534; }
    .no-data { text-align: center; color: #64748b; font-style: italic; padding: 20px; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏗️ SmartSite</h1>
      <p>Rapport Quotidien des Matériaux</p>
      <p style="font-size: 1.1rem; margin-top: 10px;">${data.date}</p>
    </div>
    <div class="content">
      <!-- Résumé en chiffres -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-number" style="color: #3b82f6;">${data.totalActiveMaterials}</div>
          <div class="summary-label">Matériaux Actifs</div>
        </div>
        <div class="summary-card">
          <div class="summary-number" style="color: ${getSeverityColor(data.lowStockMaterials.length)};">${data.lowStockMaterials.length}</div>
          <div class="summary-label">Stock Bas</div>
        </div>
        <div class="summary-card">
          <div class="summary-number" style="color: ${getSeverityColor(data.outOfStockMaterials.length)};">${data.outOfStockMaterials.length}</div>
          <div class="summary-label">Ruptures</div>
        </div>
        <div class="summary-card">
          <div class="summary-number" style="color: ${getSeverityColor(data.expiringMaterials.length)};">${data.expiringMaterials.length}</div>
          <div class="summary-label">Expirants (7j)</div>
        </div>
      </div>

      <!-- Matériaux en stock bas -->
      <div class="section">
        <div class="section-title">📦 Matériaux en Stock Bas</div>
        ${
          data.lowStockMaterials.length === 0
            ? '<div class="no-data">✅ Aucun matériau en stock bas</div>'
            : `<table class="table">
            <thead>
              <tr>
                <th>Matériau</th>
                <th>Code</th>
                <th>Stock Actuel</th>
                <th>Seuil Min</th>
                <th>Site</th>
              </tr>
            </thead>
            <tbody>
              ${data.lowStockMaterials
                .map(
                  (material) => `
                <tr>
                  <td><strong>${material.name}</strong></td>
                  <td>${material.code}</td>
                  <td><span class="badge badge-warning">${material.currentQuantity}</span></td>
                  <td>${material.minimumStock}</td>
                  <td>${material.siteName}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>`
        }
      </div>

      <!-- Matériaux en rupture -->
      <div class="section">
        <div class="section-title">🚨 Matériaux en Rupture</div>
        ${
          data.outOfStockMaterials.length === 0
            ? '<div class="no-data">✅ Aucun matériau en rupture</div>'
            : `<table class="table">
            <thead>
              <tr>
                <th>Matériau</th>
                <th>Code</th>
                <th>Site</th>
              </tr>
            </thead>
            <tbody>
              ${data.outOfStockMaterials
                .map(
                  (material) => `
                <tr>
                  <td><strong>${material.name}</strong></td>
                  <td>${material.code}</td>
                  <td>${material.siteName}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>`
        }
      </div>

      <!-- Matériaux expirants -->
      <div class="section">
        <div class="section-title">⏰ Matériaux Expirant dans 7 jours</div>
        ${
          data.expiringMaterials.length === 0
            ? '<div class="no-data">✅ Aucun matériau expirant prochainement</div>'
            : `<table class="table">
            <thead>
              <tr>
                <th>Matériau</th>
                <th>Code</th>
                <th>Date d'expiration</th>
                <th>Jours restants</th>
                <th>Site</th>
              </tr>
            </thead>
            <tbody>
              ${data.expiringMaterials
                .map(
                  (material) => `
                <tr>
                  <td><strong>${material.name}</strong></td>
                  <td>${material.code}</td>
                  <td>${material.expiryDate}</td>
                  <td><span class="badge ${material.daysRemaining <= 3 ? 'badge-critical' : 'badge-warning'}">${material.daysRemaining} jour${material.daysRemaining > 1 ? 's' : ''}</span></td>
                  <td>${material.siteName}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>`
        }
      </div>

      <!-- Anomalies détectées -->
      <div class="section">
        <div class="section-title">⚠️ Anomalies Détectées (24h)</div>
        ${
          data.anomalies.length === 0
            ? '<div class="no-data">✅ Aucune anomalie détectée</div>'
            : `<table class="table">
            <thead>
              <tr>
                <th>Matériau</th>
                <th>Type d'anomalie</th>
                <th>Message</th>
                <th>Heure</th>
              </tr>
            </thead>
            <tbody>
              ${data.anomalies
                .map(
                  (anomaly) => `
                <tr>
                  <td><strong>${anomaly.materialName}</strong><br><small>${anomaly.materialCode}</small></td>
                  <td><span class="badge badge-warning">${anomaly.anomalyType}</span></td>
                  <td>${anomaly.message}</td>
                  <td>${anomaly.timestamp}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>`
        }
      </div>

      <!-- Recommandations urgentes -->
      <div class="section">
        <div class="section-title">🚨 Recommandations Urgentes</div>
        ${
          data.criticalRecommendations.length === 0
            ? '<div class="no-data">✅ Aucune recommandation urgente</div>'
            : `<table class="table">
            <thead>
              <tr>
                <th>Matériau</th>
                <th>Message</th>
                <th>Qté Recommandée</th>
              </tr>
            </thead>
            <tbody>
              ${data.criticalRecommendations
                .map(
                  (rec) => `
                <tr>
                  <td><strong>${rec.materialName}</strong><br><small>${rec.materialCode}</small></td>
                  <td><span class="badge badge-critical">${rec.message}</span></td>
                  <td>${rec.recommendedQuantity} unités</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>`
        }
      </div>

      <!-- Actions recommandées -->
      <div style="margin-top: 30px; padding: 20px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
        <h3 style="margin: 0 0 15px 0; color: #166534;">📋 Actions Recommandées</h3>
        <ul style="margin: 0; color: #166534;">
          ${data.outOfStockMaterials.length > 0 ? '<li>🚨 <strong>Priorité 1:</strong> Passer commandes urgentes pour les matériaux en rupture</li>' : ''}
          ${data.lowStockMaterials.length > 0 ? '<li>⚡ <strong>Priorité 2:</strong> Planifier réapprovisionnement pour les stocks bas</li>' : ''}
          ${data.expiringMaterials.length > 0 ? '<li>⏰ <strong>Priorité 3:</strong> Utiliser en priorité les matériaux expirant prochainement</li>' : ''}
          ${data.anomalies.length > 0 ? '<li>🔍 <strong>Vérification:</strong> Analyser les anomalies de consommation détectées</li>' : ''}
          <li>📊 <strong>Suivi:</strong> Consulter le tableau de bord SmartSite pour plus de détails</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>Cet email a été généré automatiquement par le système SmartSite.<br>
      Veuillez ne pas répondre à cet email.</p>
      <p>© ${new Date().getFullYear()} SmartSite - Gestion Intelligente des Matériaux</p>
    </div>
  </div>
</body>
</html>`;
  }

  private getAnomalyTypeLabel(type: AnomalyType): string {
    switch (type) {
      case AnomalyType.EXCESSIVE_OUT:
        return 'Sortie excessive';
      case AnomalyType.EXCESSIVE_IN:
        return 'Entrée excessive';
      case AnomalyType.BELOW_SAFETY_STOCK:
        return 'Stock critique';
      case AnomalyType.UNEXPECTED_MOVEMENT:
        return 'Mouvement inattendu';
      default:
        return 'Anomalie détectée';
    }
  }
}
