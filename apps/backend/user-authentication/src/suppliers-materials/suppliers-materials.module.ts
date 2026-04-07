import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SuppliersMaterialsController } from './suppliers-materials.controller';
import { SuppliersMaterialsService } from './suppliers-materials.service';
import { SupplierMaterial, SupplierMaterialSchema } from './entities/supplier-material.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SupplierMaterial.name, schema: SupplierMaterialSchema }]),
  ],
  controllers: [SuppliersMaterialsController],
  providers: [SuppliersMaterialsService],
  exports: [SuppliersMaterialsService],
})
export class SuppliersMaterialsModule {}