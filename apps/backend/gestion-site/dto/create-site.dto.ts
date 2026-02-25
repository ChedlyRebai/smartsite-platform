import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max, IsNotEmpty, IsEnum, IsDateString, IsObject } from 'class-validator';
import { Prop } from '@nestjs/mongoose';

export class CreateSiteDto {
  // Backend fields
  @IsString()
  @IsNotEmpty()
  @Prop({ required: true, trim: true })
  nom: string;

  @IsString()
  @IsNotEmpty()
  @Prop({ required: true, trim: true })
  adresse: string;

  @IsString()
  @IsNotEmpty()
  @Prop({ required: true, trim: true })
  localisation: string;

  @IsNumber()
  @Min(0)
  @Prop({ required: true, type: Number })
  budget: number;

  @IsString()
  @IsOptional()
  @Prop()
  description?: string;

  @IsBoolean()
  @Prop({ default: true })
  estActif: boolean;

  // Frontend fields
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Prop({ type: Number, default: 0 })
  area?: number;

  @IsString()
  @IsOptional()
  @IsEnum(['planning', 'in_progress', 'on_hold', 'completed'])
  @Prop({ type: String, enum: ['planning', 'in_progress', 'on_hold', 'completed'], default: 'planning' })
  status?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  @Prop({ type: Number, default: 0 })
  progress?: number;

  @IsDateString()
  @IsOptional()
  @Prop({ type: Date })
  workStartDate?: string;

  @IsDateString()
  @IsOptional()
  @Prop({ type: Date })
  workEndDate?: string;

  @IsString()
  @IsOptional()
  @Prop({ type: String })
  projectId?: string;

  @IsObject()
  @IsOptional()
  @Prop({ type: Object })
  coordinates?: { lat: number; lng: number };
}

export class UpdateSiteDto {
  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  localisation?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  budget?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  estActif?: boolean;

  // Frontend fields
  @IsNumber()
  @IsOptional()
  @Min(0)
  area?: number;

  @IsString()
  @IsOptional()
  @IsEnum(['planning', 'in_progress', 'on_hold', 'completed'])
  status?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsDateString()
  @IsOptional()
  workStartDate?: string;

  @IsDateString()
  @IsOptional()
  workEndDate?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsObject()
  @IsOptional()
  coordinates?: { lat: number; lng: number };
}
