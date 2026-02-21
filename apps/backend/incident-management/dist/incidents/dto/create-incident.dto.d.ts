import { IncidentType, IncidentDegree } from "../entities/incident.entity";
export declare class CreateIncidentDto {
    type: IncidentType;
    degree: IncidentDegree;
    title: string;
    description?: string;
    reportedBy?: string;
    siteId?: string;
    projectId?: string;
    location?: string;
    reporterName?: string;
    reporterPhone?: string;
    affectedPersons?: string;
    immediateAction?: string;
    status?: string;
}
