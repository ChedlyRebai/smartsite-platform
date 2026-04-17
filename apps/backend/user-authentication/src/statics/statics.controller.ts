import { StaticsService } from './statics.service';
import { Controller, Get } from '@nestjs/common';

@Controller('stats')
export class StaticsController {
  constructor(private staticsService: StaticsService) {}
  @Get()
  getStats() {
    return this.staticsService.getStats();
  }
}
