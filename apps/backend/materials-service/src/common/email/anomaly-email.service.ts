import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AnomalyType } from '../../materials/entities/material-flow-log.entity';

interface AnomalyAlertData {
  toEmail: string;
  userName: string;
  siteName: string;
  materialName: string;
  materialCode: string;
  flowType: string;
  quantity: number;
  anomalyType: AnomalyType;
  anomalyMessage: string;
  currentStock: number;
  previousStock: number;
  expectedQuantity?: number;
  deviationPercent?: number;
  timestamp: Date;
  reason?: string;
}

@Injectable()
export class AnomalyEmailService {
  private readonly logger = new Logger(AnomalyEmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const smtpUser = this.configService.get<string>('SMTP_USER') || this.configService.get<string>('EMAIL_USER') || '';
    const smtpPass = this.configService.get<string>('SMTP_PASS') || this.configService.get<string>('EMAIL_PASSWORD') || '';

    if (smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
        port: this.configService.get<number>('SMTP_PORT') || 587,
        secure: false,
        auth: { 
          user: smtpUser, 
          pass: smtpPass 
        },
      });
      this.logger.log('✅ Email transporter configured for anomaly alerts');
      this.logger.log(`📧 SMTP: ${this.configService.get<string>('SMTP_HOST')}:${this.configService.get<number>('SMTP_PORT')}`);
    } else {
      this.logger.warn('⚠️ Email not configured - anomaly alerts will not be sent');
    }
  }

  async sendStockAnomalyAlert(data: AnomalyAlertData): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email not configured, skipping anomaly alert');
      return;
    }

    const subject = this.getSubject(data);
    const html = this.generateAnomalyEmailHtml(data);
    const smtpFrom = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('EMAIL_FROM') || `"SmartSite Alert" <${this.configService.get<string>('SMTP_USER')}>`;

    try {
      await this.transporter.sendMail({
        from: smtpFrom,
        to: data.toEmail,
        cc: this.configService.get<string>('ADMIN_EMAIL'),
        subject,
        html,
      });
      this.logger.log(`✅ Anomaly email sent to ${data.toEmail}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send anomaly email: ${error.message}`);
    }
  }

  private getSubject(data: AnomalyAlertData): string {
    const severity = this.getSeverityEmoji(data.anomalyType);
    return `${severity} ALERTE SmartSite: ${this.getAnomalyLabel(data.anomalyType)} - ${data.materialName} (${data.siteName})`;
  }

  private getSeverityEmoji(type: AnomalyType): string {
    switch (type) {
      case AnomalyType.EXCESSIVE_OUT:
        return '🚨';
      case AnomalyType.BELOW_SAFETY_STOCK:
        return '⚠️';
      case AnomalyType.EXCESSIVE_IN:
        return '📦';
      default:
        return 'ℹ️';
    }
  }

  private getAnomalyLabel(type: AnomalyType): string {
    switch (type) {
      case AnomalyType.EXCESSIVE_OUT:
        return 'Sortie excessive détectée';
      case AnomalyType.EXCESSIVE_IN:
        return 'Entrée anormalement élevée';
      case AnomalyType.BELOW_SAFETY_STOCK:
        return 'Stock de sécurité critique';
      default:
        return 'Anomalie détectée';
    }
  }

  private generateAnomalyEmailHtml(data: AnomalyAlertData): string {
    const severityColor = this.getSeverityColor(data.anomalyType);
    
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartSite - Alerte Stock</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f6f9; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #0c1929 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .alert-banner { background: ${severityColor}; color: white; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center; }
    .alert-banner h2 { margin: 0; font-size: 20px; }
    .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .info-label { width: 40%; font-weight: 600; color: #475569; }
    .info-value { width: 60%; color: #1e293b; }
    .warning-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 8px; }
    .warning-box p { margin: 0; color: #991b1b; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-critical { background: #dc2626; color: white; }
    .badge-warning { background: #f59e0b; color: white; }
    .badge-info { background: #3b82f6; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏗️ SmartSite</h1>
      <p>Système de Gestion des Matériaux</p>
    </div>
    <div class="content">
      <div class="alert-banner">
        <h2>${this.getSeverityEmoji(data.anomalyType)} ${this.getAnomalyLabel(data.anomalyType)}</h2>
      </div>

      <div class="info-row">
        <div class="info-label">📋 Matériau:</div>
        <div class="info-value"><strong>${this.escapeHtml(data.materialName)}</strong> (${this.escapeHtml(data.materialCode)})</div>
      </div>
      <div class="info-row">
        <div class="info-label">🏗️ Chantier:</div>
        <div class="info-value">${this.escapeHtml(data.siteName)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">🕐 Date/Heure:</div>
        <div class="info-value">${new Date(data.timestamp).toLocaleString('fr-FR')}</div>
      </div>
      <div class="info-row">
        <div class="info-label">📦 Type de mouvement:</div>
        <div class="info-value">${data.flowType === 'IN' ? 'ENTRÉE' : 'SORTIE'}</div>
      </div>
      <div class="info-row">
        <div class="info-label">🔢 Quantité:</div>
        <div class="info-value"><strong>${data.quantity}</strong> unités</div>
      </div>

      ${data.expectedQuantity ? `
      <div class="info-row">
        <div class="info-label">📊 Quantité normale attendue:</div>
        <div class="info-value">${data.expectedQuantity.toFixed(1)} unités/jour</div>
      </div>
      ` : ''}

      ${data.deviationPercent ? `
      <div class="info-row">
        <div class="info-label">⚠️ Déviation:</div>
        <div class="info-value" style="color: #dc2626;">+${data.deviationPercent.toFixed(1)}% au-dessus de la normale</div>
      </div>
      ` : ''}

      <div class="info-row">
        <div class="info-label">📈 Stock avant mouvement:</div>
        <div class="info-value">${data.previousStock} unités</div>
      </div>
      <div class="info-row">
        <div class="info-label">📉 Stock après mouvement:</div>
        <div class="info-value ${data.currentStock < 0 ? 'warning-value' : ''}"><strong>${data.currentStock} unités</strong></div>
      </div>

      ${data.reason ? `
      <div class="info-row">
        <div class="info-label">💬 Raison:</div>
        <div class="info-value">${this.escapeHtml(data.reason)}</div>
      </div>
      ` : ''}

      <div class="warning-box">
        <p><strong>🔔 Message d'alerte:</strong></p>
        <p>${this.escapeHtml(data.anomalyMessage)}</p>
      </div>

      <div style="margin-top: 25px; padding: 15px; background: #f0fdf4; border-radius: 8px; text-align: center;">
        <p style="margin: 0; color: #166534;">
          <strong>✅ Actions recommandées:</strong><br>
          1. Vérifier la consommation réelle sur site<br>
          2. Ajuster les seuils de commande si nécessaire<br>
          3. Passer une commande de réapprovisionnement si stock critique
        </p>
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

  private getSeverityColor(type: AnomalyType): string {
    switch (type) {
      case AnomalyType.EXCESSIVE_OUT:
        return '#dc2626'; // Rouge
      case AnomalyType.BELOW_SAFETY_STOCK:
        return '#f59e0b'; // Orange
      case AnomalyType.EXCESSIVE_IN:
        return '#3b82f6'; // Bleu
      default:
        return '#64748b';
    }
  }

  private escapeHtml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}