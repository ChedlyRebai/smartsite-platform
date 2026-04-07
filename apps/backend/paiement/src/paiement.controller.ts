import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Request } from '@nestjs/common';
import { PaiementService } from './paiement.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto';
import { Roles } from './auth/roles.decorator';

@Controller('api/payments')
export class PaiementController {
  constructor(private readonly paiementService: PaiementService) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    const userId = req.user?.sub || null;
    return this.paiementService.create(createPaymentDto, userId);
  }

  @Get()
  findAll() {
    return this.paiementService.findAll();
  }

  // Static sub-routes must be declared BEFORE the dynamic :id route
  @Get('site/:siteId/total')
  getTotalPaymentsBySite(@Param('siteId') siteId: string) {
    return this.paiementService.getTotalPaymentsBySite(siteId);
  }

  /** Returns payment status for a site:
  - hasPaid: true if site already has a completed payment
  - totalPaid: total amount paid so far
  - remaining: remaining budget to pay
  */
  @Get('site/:siteId/paid')
  async checkSitePaid(
    @Param('siteId') siteId: string,
    @Query('budget') budget?: string,
  ) {
    const siteBudget = budget ? parseFloat(budget) : 0;
    const status = await this.paiementService.getPaymentStatus(siteId, siteBudget);
    return status;
  }

  @Get('site/:siteId')
  findBySite(@Param('siteId') siteId: string) {
    return this.paiementService.findBySite(siteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paiementService.findOne(id);
  }

  @Patch(':id')
  @Roles('accountant', 'admin')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto, @Request() req) {
    const userId = req.user?.sub;
    return this.paiementService.update(id, updatePaymentDto, userId);
  }

  @Delete(':id')
  @Roles('accountant', 'admin')
  remove(@Param('id') id: string) {
    return this.paiementService.remove(id);
  }
}
