import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { DataCollectionModule } from './modules/data-collection/data-collection.module';
import { ResourceAnalysisModule } from './modules/resource-analysis/resource-analysis.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { AlertModule } from './modules/alert/alert.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { ExternalDataModule } from './modules/external-data/external-data.module';
import { ExternalDataController } from './modules/external-data/external-data.controller';
import { ExternalDataService } from './modules/external-data/external-data.service';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsite-optimization',
    ),
    DataCollectionModule,
    ResourceAnalysisModule,
    RecommendationModule,
    AlertModule,
    ReportingModule,
    ExternalDataModule,
    ChatModule,
  ],
  controllers: [ExternalDataController],
  providers: [ExternalDataService],
})
export class AppModule {}
