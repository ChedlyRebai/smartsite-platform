import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { AlertModule } from '../alert/alert.module';
import { ReportingModule } from '../reporting/reporting.module';
import { PowerBiController } from './power-bi.controller';
import { PowerBiService } from './power-bi.service';
import { Recommendation, RecommendationSchema } from '../../schemas/recommendation.schema';
import { Alert, AlertSchema } from '../../schemas/alert.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recommendation.name, schema: RecommendationSchema },
      { name: Alert.name, schema: AlertSchema },
    ]),
    RecommendationModule,
    AlertModule,
    ReportingModule,
  ],
  controllers: [PowerBiController],
  providers: [PowerBiService],
  exports: [PowerBiService],
})
export class PowerBiModule {}