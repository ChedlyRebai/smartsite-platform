import { IsEnum, IsOptional, IsString } from "class-validator";
import {
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
} from "../entities/incident.entity";

export class UpdateIncidentDto {
  @IsEnum(IncidentType)
  @IsOptional()
  type?: IncidentType;

  @IsEnum(IncidentSeverity)
  @IsOptional()
  severity?: IncidentSeverity;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  reportedBy?: string;

  @IsString()
  @IsOptional()
  siteId?: string;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;

  @IsString()
  @IsOptional()
  resolutionNotes?: string;

  @IsString()
  @IsOptional()
  resolvedBy?: string;

  // CIN optionnel de l'utilisateur auquel l'incident est adressé (mise à jour)
  @IsString()
  @IsOptional()
  assignedToCin?: string;

  @IsString()
  @IsOptional()
  assignedUserRole?: string;
}
