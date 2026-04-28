import { IsString, IsNumber, IsOptional, IsEnum, Min, Max, IsArray, IsObject, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMaterialDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  category: string;

  @IsString()
  unit: string;

  // ========== ANCIENS CHAMPS (optionnels pour compatibilité) ==========
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderPoint?: number;

  // ========== NOUVEAUX CHAMPS V2 ==========
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockExistant?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockEntree?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockSortie?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockMinimum?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockActuel?: number;

  @IsOptional()
  @IsBoolean()
  needsReorder?: boolean;

  // ========== AUTRES CHAMPS ==========
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  qualityGrade?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiryDate?: Date;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @IsOptional()
  @IsArray()
  assignedProjects?: string[];
}