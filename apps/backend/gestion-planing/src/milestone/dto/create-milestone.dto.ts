import { IsNotEmpty } from "class-validator";

export class CreateMilestoneDto {
    @IsNotEmpty()
    name: string
    description?: string
    projectId?: string
    siteId?: string;
    createdBy?: string
    updatedBy?: string;
    startDate?: Date
    endDate?: Date
}
