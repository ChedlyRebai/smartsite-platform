import { IsString, IsNumber, IsOptional, IsEnum, Min, IsDate, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { FlowType, AnomalyType } from '../entities/material-flow-log.entity';

export class CreateMaterialFlowDto {
  @IsMongoId()
  siteId: string;

  @IsMongoId()
  materialId: string;

  @IsEnum(FlowType)
  type: FlowType;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  reference?: string;
}

export class MaterialFlowQueryDto {
  @IsOptional()
  @IsMongoId()
  siteId?: string;

  @IsOptional()
  @IsMongoId()
  materialId?: string;

  @IsOptional()
  @IsEnum(FlowType)
  type?: FlowType;

  @IsOptional()
  @IsEnum(AnomalyType)
  anomalyDetected?: AnomalyType;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 50;
}

export class AnomalyDetectionConfig {
  @IsNumber()
  @Min(0)
  normalConsumptionRate: number;      // Quantité normale par jour
  
  @IsNumber()
  @Min(0)
  maxDeviationPercent: number;        // Déviation max en % (ex: 50%)
  
  @IsOptional()
  @IsNumber()
  @Min(0)
  safetyStockLevel?: number;           // Niveau de sécurité
}

export interface FlowValidationResult {
  isValid: boolean;
  anomalyType: AnomalyType;
  message: string;
  expectedQuantity?: number;
  deviationPercent?: number;
}

export interface DailyConsumptionStats {
  materialId: string;
  siteId: string;
  averageDailyConsumption: number;
  maxDailyConsumption: number;
  minDailyConsumption: number;
  totalConsumptionLast30Days: number;
  daysWithData: number;
  lastUpdated: Date;
}