import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { IncidentType, IncidentDegree } from "../entities/incident.entity";

export class CreateIncidentDto {
  @IsEnum(IncidentType)
  type: IncidentType;

  @IsEnum(IncidentDegree)
  degree: IncidentDegree;

  @IsString()
  @IsNotEmpty()
  title: string;

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

  @IsString()
  @IsOptional()
  reporterName?: string;

  @IsString()
  @IsOptional()
  reporterPhone?: string;

  @IsString()
  @IsOptional()
  affectedPersons?: string;

  @IsString()
  @IsOptional()
  immediateAction?: string;

  @IsEnum(["open", "in_progress", "resolved", "closed"])
  @IsOptional()
  status?: string;
}
