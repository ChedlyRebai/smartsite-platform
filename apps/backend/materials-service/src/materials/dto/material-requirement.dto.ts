import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMaterialRequirementDto {
  @IsMongoId()
  siteId: string;

  @IsMongoId()
  materialId: string;

  @IsNumber()
  @Min(0)
  initialQuantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateConsumptionDto {
  @IsNumber()
  @Min(0)
  consumedQuantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class MaterialRequirementQueryDto {
  @IsOptional()
  @IsMongoId()
  siteId?: string;

  @IsOptional()
  @IsMongoId()
  materialId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minProgress?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxProgress?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

export interface SiteConsumptionStats {
  siteId: string;
  siteName: string;
  totalInitialQuantity: number;
  totalConsumedQuantity: number;
  totalRemainingQuantity: number;
  overallProgress: number;
  materialsCount: number;
  materials: Array<{
    materialId: string;
    materialName: string;
    materialCode: string;
    initialQuantity: number;
    consumedQuantity: number;
    remainingQuantity: number;
    progressPercentage: number;
  }>;
}
