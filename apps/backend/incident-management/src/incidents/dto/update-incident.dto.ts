import { IsEnum, IsOptional, IsString } from "class-validator";
import { IncidentType, IncidentDegree } from "../entities/incident.entity";

export class UpdateIncidentDto {
  @IsEnum(IncidentType)
  @IsOptional()
  type?: IncidentType;

  @IsEnum(IncidentDegree)
  @IsOptional()
  degree?: IncidentDegree;

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
  projectId?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(["open", "in_progress", "resolved", "closed"])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  resolutionNotes?: string;

  @IsString()
  @IsOptional()
  resolvedBy?: string;
}
