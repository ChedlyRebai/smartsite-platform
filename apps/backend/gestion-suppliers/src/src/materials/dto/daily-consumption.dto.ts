import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateDailyConsumptionDto {
  @IsString()
  materialId: string;

  @IsString()
  siteId: string;

  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  quantityUsed: number;

  @IsNumber()
  @Min(0)
  expectedConsumption: number;

  @IsOptional()
  @IsNumber()
  anomalyScore?: number;
}

export class UpdateConsumptionDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityUsed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedConsumption?: number;
}

export class ConsumptionQueryDto {
  @IsOptional()
  @IsString()
  materialId?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  anomalyType?: 'vol' | 'probleme' | 'normal';
}

export interface ConsumptionAnomalyResult {
  consumption: any;
  anomalyType: 'VOL_POSSIBLE' | 'CHANTIER_BLOQUE' | 'NORMAL';
  anomalyScore: number;
  message: string;
  severity: 'critical' | 'warning' | 'normal';
}
