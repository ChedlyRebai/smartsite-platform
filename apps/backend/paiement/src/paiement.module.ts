import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { PaiementController } from './paiement.controller';
import { PaiementService } from './paiement.service';
import { Payment, PaymentSchema } from './entities/payment.entity';
import { JwtStrategy } from './auth/jwt.strategy';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
    ]),
    // Don't set default strategy - apply JWT guard per-route instead
  ],
  controllers: [PaiementController],
  providers: [PaiementService, JwtStrategy, RolesGuard],
  exports: [PaiementService]
})
export class PaiementModule {}
