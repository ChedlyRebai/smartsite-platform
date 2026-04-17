import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogItem, CatalogItemSchema } from './entities/catalog-item.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CatalogItem.name, schema: CatalogItemSchema },
    ]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
