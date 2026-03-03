import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GestionSiteService } from './gestion-site.service';
import { GestionSiteController } from './gestion-site.controller';
import { Site, SiteSchema } from './entities/site.entity';
import { UserSimple, UserSimpleSchema } from './entities/user-simple.entity';
import { Team, TeamSchema } from './entities/team.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Site.name, schema: SiteSchema },
      { name: UserSimple.name, schema: UserSimpleSchema },
      { name: Team.name, schema: TeamSchema },
    ]),
  ],
  providers: [GestionSiteService],
  controllers: [GestionSiteController],
  exports: [GestionSiteService],
})
export class GestionSiteModule {}
