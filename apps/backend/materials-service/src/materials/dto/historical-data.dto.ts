import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class HistoricalDataPointDto {
  @IsDateString()
  hour: string;

  @IsNumber()
  stock: number;

  @IsNumber()
  consumption: number;

  @IsString()
  @IsOptional()
  project?: string;

  @IsNumber()
  @Min(0)
  @Max(23)
  @IsOptional()
  hourOfDay?: number;

  @IsNumber()
  @Min(0)
  @Max(6)
  @IsOptional()
  dayOfWeek?: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  siteActivityLevel?: number;

  @IsString()
  @IsOptional()
  weather?: string;

  @IsString()
  @IsOptional()
  projectType?: string;
}

export class UploadCsvDto {
  @IsString()
  materialId: string;
}

export interface ParsedHistoricalData {
  materialId: string;
  data: HistoricalDataPointDto[];
  totalRecords: number;
  dateRange: {
    start: string;
    end: string;
  };
  averageConsumption: number;
}

export interface TrainingResult {
  materialId: string;
  success: boolean;
  epochs: number;
  loss: number;
  accuracy: number;
  sampleSize: number;
  trainedAt: Date;
}

export interface PredictionResult {
  materialId: string;
  materialName: string;
  currentStock: number;
  predictedStock: number;
  hoursToLowStock: number;
  hoursToOutOfStock: number;
  consumptionRate: number;
  modelTrained: boolean;
  confidence: number;
  status: 'safe' | 'warning' | 'critical';
  trainingDataAvailable: boolean;
  message: string;
  /** Aligné avec StockPredictionResult (liste prédictions / UI) */
  recommendedOrderQuantity?: number;
}

export class AdvancedPredictionFeaturesDto {
  @IsNumber()
  @Min(0)
  @Max(23)
  hourOfDay: number;

  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  siteActivityLevel: number;

  @IsString()
  weather: string;

  @IsString()
  projectType: string;
}

export interface AdvancedPredictionResult {
  materialId: string;
  materialName: string;
  currentStock: number;
  predictedStock: number;
  hoursToOutOfStock: number;
  consumptionRate: number;
  modelTrained: boolean;
  confidence: number;
  status: 'safe' | 'warning' | 'critical';
  recommendedOrderQuantity: number;
  estimatedRuptureDate: string;
  message: string;
}
