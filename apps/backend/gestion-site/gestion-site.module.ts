import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GestionSiteService } from './gestion-site.service';
import { GestionSiteController } from './gestion-site.controller';
import { Site, SiteSchema } from './entities/site.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Site.name, schema: SiteSchema }]),
  ],
  providers: [GestionSiteService],
  controllers: [GestionSiteController],
  exports: [GestionSiteService],
})
export class GestionSiteModule {}
