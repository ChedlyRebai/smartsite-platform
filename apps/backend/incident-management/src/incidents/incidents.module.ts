import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IncidentsService } from "./incidents.service";
import { IncidentsController } from "./incidents.controller";
import { Incident, IncidentSchema } from "./entities/incident.entity";
import { IncidentsGateway } from "./incidents.gateway";
import { IncidentEventsService } from "./incidents-events.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Incident.name, schema: IncidentSchema },
    ]),
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentsGateway, IncidentEventsService],
})
export class IncidentsModule {}
