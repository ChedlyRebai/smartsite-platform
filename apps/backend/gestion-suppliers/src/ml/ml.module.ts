import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MLService } from './ml.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [MLService],
  exports: [MLService],
})
export class MLModule {}
