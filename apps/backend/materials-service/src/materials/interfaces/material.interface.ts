import { Material } from '../entities/material.entity';

export interface StockMovement {
  materialId: string;
  quantity: number;
  type: 'in' | 'out' | 'adjustment' | 'damage' | 'return' | 'reserve';
  date: Date;
  userId: string;
  projectId?: string;
  reason?: string;
  previousStock: number;
  newStock: number;
}

export interface StockAlert {
  materialId: string;
  materialName: string;
  currentQuantity: number;
  threshold: number;
  type: 'low_stock' | 'out_of_stock' | 'expiring' | 'overstock';
  severity: 'low' | 'medium' | 'high';
  message: string;
  date: Date;
  expiryDate?: Date;
  maximumStock?: number;
}

export interface MaterialForecast {
  materialId: string;
  currentStock: number;
  dailyConsumption: number;
  daysRemaining: number;
  reorderDate: Date;
  suggestedOrderQuantity: number;
  confidence: number;
  trends: {
    date: Date;
    consumption: number;
  }[];
}

export interface QRScanResult {
  success: boolean;
  qrData: string;
  material: Material | null;
}
