import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { MLModule } from '../ml/ml.module';
import { Supplier, SupplierSchema } from './entities/supplier.entity';
import { SupplierRating, SupplierRatingSchema } from './entities/supplier-rating.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Supplier.name, schema: SupplierSchema },
      { name: SupplierRating.name, schema: SupplierRatingSchema },
    ]),
    HttpModule,
    ConfigModule,
    MLModule,
  ],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
