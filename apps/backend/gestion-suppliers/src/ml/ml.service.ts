import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const ML_API_URL = 'http://localhost:8001';

export interface PredictDelayInput {
  supplierId: string;
  amount: number;
  days: number;
  month: number;
  supplierRating?: number;
}

export interface PredictDelayOutput {
  risk_percentage: number;
  risk_level: string;
  risk_color: string;
  recommendation: string;
  will_be_late: boolean;
}

export interface SupplierStats {
  name: string;
  late_rate: number;
  avg_delay: number;
  total_orders: number;
}

@Injectable()
export class MLService {
  private readonly logger = new Logger(MLService.name);

  constructor(private readonly httpService: HttpService) {}

  async predictDelay(data: PredictDelayInput): Promise<PredictDelayOutput> {
    try {
      const payload = {
        supplier_id: Number(data.supplierId) || 0,
        order_amount: Number(data.amount) || 10000,
        planned_days: Number(data.days) || 5,
        supplier_rating: Number(data.supplierRating) || 0,
        order_month: Number(data.month) || new Date().getMonth() + 1,
      };
      
      this.logger.log('Envoi ML API:', JSON.stringify(payload));
      
      const response = await firstValueFrom(
        this.httpService.post<PredictDelayOutput>(
          `${ML_API_URL}/predict`,
          payload,
          { timeout: 5000 },
        ),
      );
      
      this.logger.log('Réponse ML API:', response.data);
      return response.data;
    } catch (error) {
      this.logger.error('ML API /predict error:', {
        message: error.message,
        response: error.response?.data,
      });
      return this.getFallbackPrediction(data);
    }
  }

  async getSupplierStats(supplierId: string): Promise<SupplierStats | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<SupplierStats>(
          `${ML_API_URL}/supplier/${supplierId}/stats`,
          { timeout: 5000 },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('ML API /supplier/stats unavailable', error.message);
      return null;
    }
  }

  private getFallbackPrediction(data: PredictDelayInput): PredictDelayOutput {
    const risk = data.days <= 3 ? 0.15 : data.days <= 7 ? 0.35 : 0.6;
    const risk_percentage = Math.round(risk * 100);
    let risk_level: string;
    let risk_color: string;
    if (risk_percentage >= 50) {
      risk_level = 'Élevé';
      risk_color = '#ef4444';
    } else if (risk_percentage >= 25) {
      risk_level = 'Modéré';
      risk_color = '#f97316';
    } else {
      risk_level = 'Faible';
      risk_color = '#22c55e';
    }
    return {
      risk_percentage,
      risk_level,
      risk_color,
      recommendation: "L'API ML est indisponible. Utilisation d'une estimation basée sur les délais.",
      will_be_late: risk_percentage >= 50,
    };
  }
}
