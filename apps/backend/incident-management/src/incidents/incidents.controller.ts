import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from "@nestjs/common";
import { IncidentsService } from "./incidents.service";
import { CreateIncidentDto } from "./dto/create-incident.dto";
import { UpdateIncidentDto } from "./dto/update-incident.dto";

@Controller("incidents")
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) { }

  @Get()
  findAll() {
    return this.incidentsService.findAll();
  }

  @Get("by-site/:siteId")
  findBySite(@Param("siteId") siteId: string) {
    return this.incidentsService.findBySite(siteId);
  }

  @Get("by-project/:projectId")
  findByProject(@Param("projectId") projectId: string) {
    return this.incidentsService.findByProject(projectId);
  }

  @Get("count-by-site/:siteId")
  async countBySite(@Param("siteId") siteId: string) {
    const count = await this.incidentsService.countBySite(siteId);
    return { count, siteId };
  }

  @Get("count-by-project/:projectId")
  async countByProject(@Param("projectId") projectId: string) {
    const count = await this.incidentsService.countByProject(projectId);
    return { count, projectId };
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.incidentsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateIncidentDto) {
    return this.incidentsService.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateIncidentDto) {
    return this.incidentsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.incidentsService.remove(id);
  }
}
