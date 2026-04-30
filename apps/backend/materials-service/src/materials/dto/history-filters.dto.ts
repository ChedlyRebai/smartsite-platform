import {
  IsOptional,
  IsString,
  IsNumber,
  IsDate,
  IsEnum,
  IsArray,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  FlowType,
  AnomalyType,
  AnomalySeverity,
} from '../entities/consumption-history.entity';

export class HistoryFiltersDto {
  // Filtres de base
  @IsOptional()
  @IsString()
  materialId?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  // Filtres temporels
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  // Filtres de type
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',');
    return value;
  })
  @IsArray()
  @IsEnum(FlowType, { each: true })
  flowType?: FlowType[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',');
    return value;
  })
  @IsArray()
  @IsEnum(AnomalyType, { each: true })
  anomalyType?: AnomalyType[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',');
    return value;
  })
  @IsArray()
  @IsEnum(AnomalySeverity, { each: true })
  anomalySeverity?: AnomalySeverity[];

  // Filtres texte
  @IsOptional()
  @IsString()
  materialCategory?: string;

  @IsOptional()
  @IsString()
  searchText?: string;

  // Pagination et tri
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  @IsIn(['date', 'quantity', 'anomalyScore', 'materialName', 'siteName'])
  sortBy?: string = 'date';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class StatisticsFiltersDto {
  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  materialId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString()
  @IsIn(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month' = 'day';
}

export class CleanupDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  beforeDate?: Date;
}
