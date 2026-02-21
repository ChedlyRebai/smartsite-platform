import { IncidentType, IncidentDegree } from "../entities/incident.entity";
export declare class UpdateIncidentDto {
    type?: IncidentType;
    degree?: IncidentDegree;
    title?: string;
    description?: string;
    reportedBy?: string;
    siteId?: string;
    projectId?: string;
    location?: string;
    status?: string;
    resolutionNotes?: string;
    resolvedBy?: string;
}
