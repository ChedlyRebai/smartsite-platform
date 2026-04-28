import { IsString, IsNumber, IsDate, IsEnum, IsOptional, IsMongoId, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { FlowType, AnomalyType, AnomalySeverity, SourceCollection } from '../entities/consumption-history.entity';

export class CreateConsumptionHistoryDto {
  @IsMongoId()
  materialId: string;

  @IsString()
  materialName: string;

  @IsString()
  materialCode: string;

  @IsString()
  materialCategory: string;

  @IsString()
  materialUnit: string;

  @IsMongoId()
  siteId: string;

  @IsOptional()
  @IsString()
  siteName?: string;

  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsEnum(FlowType)
  flowType: FlowType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  anomalyScore?: number;

  @IsOptional()
  @IsEnum(AnomalyType)
  anomalyType?: AnomalyType;

  @IsOptional()
  @IsEnum(AnomalySeverity)
  anomalySeverity?: AnomalySeverity;

  @IsOptional()
  @IsNumber()
  stockBefore?: number;

  @IsOptional()
  @IsNumber()
  stockAfter?: number;

  @IsEnum(SourceCollection)
  sourceCollection: SourceCollection;

  @IsOptional()
  @IsMongoId()
  sourceId?: string;

  @IsOptional()
  @IsMongoId()
  recordedBy?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  projectId?: string;
}
