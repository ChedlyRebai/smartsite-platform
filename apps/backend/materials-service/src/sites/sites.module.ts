import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SitesService } from './sites.service';
import { SitesController } from './sites.controller';

@Module({
  imports: [ConfigModule],
  controllers: [SitesController],
  providers: [SitesService],
  exports: [SitesService],
})
export class SitesModule {}
