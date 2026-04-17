import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateCatalogItemDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsString()
  unit: string;

  @IsString()
  @IsOptional()
  technicalSpec?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string;
}

export class UpdateCatalogItemDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  technicalSpec?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string;
}

export class CatalogItemQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
