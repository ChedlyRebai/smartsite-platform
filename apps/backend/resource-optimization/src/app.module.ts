import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';

import { ChatModule } from './chat/chat.module';
import { AIModule } from './ai/ai.module';
import { ResourceAnalysisModule } from './modules/resource-analysis/resource-analysis.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { AlertModule } from './modules/alert/alert.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { ExternalDataModule } from './modules/external-data/external-data.module';
import { DataCollectionModule } from './modules/data-collection/data-collection.module';
import { PowerBiModule } from './modules/power-bi/power-bi.module';

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
    ChatModule,
    AIModule,
    ResourceAnalysisModule,
    RecommendationModule,
    AlertModule,
    ReportingModule,
    ExternalDataModule,
    DataCollectionModule,
    PowerBiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}