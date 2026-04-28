import { IsString, IsEmail, IsOptional, IsNumber, Min, Max, IsArray, IsBoolean } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  nom: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  codePostal?: string;

  @IsOptional()
  @IsString()
  pays?: string;

  @IsOptional()
  @IsString()
  siteWeb?: string;

  @IsOptional()
  @IsString()
  contactPrincipal?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialites?: string[];

  @IsOptional()
  @IsString()
  statut?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  delaiLivraison?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  evaluation?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  materialsSupplied?: string[];

  @IsOptional()
  coordonnees?: {
    latitude?: number;
    longitude?: number;
  };

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}