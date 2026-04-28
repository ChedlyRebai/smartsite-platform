import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface CreatePaymentDto {
  siteId: string;
  amount: number;
  paymentMethod: 'cash' | 'card';
  description?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  status: string;
  amount: number;
  paymentMethod: string;
  message: string;
  clientSecret?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly PAYMENT_API_URL = process.env.PAYMENT_API_URL || 'http://localhost:3008/api/payments';
  private readonly FACTURE_API_URL = process.env.FACTURE_API_URL || 'http://localhost:3008/api/factures';

  constructor(private readonly httpService: HttpService) {}

  async createPayment(
    siteId: string,
    amount: number,
    paymentMethod: 'cash' | 'card',
    description?: string,
  ): Promise<PaymentResult> {
    try {
      this.logger.log(`💳 Création paiement: site=${siteId}, montant=${amount}, méthode=${paymentMethod}`);

      const paymentData = {
        siteId,
        amount,
        paymentMethod,
        description: description || `Paiement pour le site ${siteId}`,
        status: paymentMethod === 'cash' ? 'completed' : 'pending',
      };

      const response = await firstValueFrom(
        this.httpService.post(`${this.PAYMENT_API_URL}`, paymentData)
      );

      const payment = response.data;
      this.logger.log(`✅ Paiement créé: ${payment._id}`);

      let clientSecret: string | undefined;
      if (paymentMethod === 'card') {
        clientSecret = await this.createStripePaymentIntent(amount);
      }

      return {
        success: true,
        paymentId: payment._id,
        status: payment.status,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        message: paymentMethod === 'cash' 
          ? 'Paiement en espèces enregistré avec succès'
          : 'Paiement par carte initié - Veuillez compléter le paiement',
        clientSecret,
      };
    } catch (error: any) {
      this.logger.error(`❌ Erreur création paiement: ${error.message}`);
      throw new BadRequestException(
        error.response?.data?.message || 'Erreur lors de la création du paiement'
      );
    }
  }

  private async createStripePaymentIntent(amount: number): Promise<string> {
    try {
      const stripeApiUrl = process.env.STRIPE_API_URL || 'http://localhost:3008/api/payments/stripe/create-payment-intent';
      
      const response = await firstValueFrom(
        this.httpService.post(stripeApiUrl, {
          amount,
          currency: 'eur',
          description: 'Paiement matériaux',
        })
      );

      return response.data.clientSecret;
    } catch (error: any) {
      this.logger.error(`❌ Erreur création Stripe: ${error.message}`);
      throw new BadRequestException('Erreur lors de l\'initialisation du paiement par carte');
    }
  }

  async getPaymentStatus(paymentId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.PAYMENT_API_URL}/${paymentId}`)
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`❌ Erreur statut paiement: ${error.message}`);
      return null;
    }
  }

  async confirmCardPayment(paymentId: string, stripePaymentIntentId: string): Promise<PaymentResult> {
    try {
      this.logger.log(`✅ Confirmation paiement Stripe: paymentId=${paymentId}, stripeId=${stripePaymentIntentId}`);
      
      const response = await firstValueFrom(
        this.httpService.patch(`${this.PAYMENT_API_URL}/${paymentId}`, {
          status: 'completed',
          stripePaymentIntentId,
        })
      );

      this.logger.log(`✅ Paiement confirmé: ${response.data._id}`);

      return {
        success: true,
        paymentId: response.data._id,
        status: 'completed',
        amount: response.data.amount,
        paymentMethod: 'card',
        message: 'Paiement par carte confirmé avec succès',
      };
    } catch (error: any) {
      this.logger.error(`❌ Erreur confirmation paiement: ${error.message}`);
      throw new BadRequestException('Erreur lors de la confirmation du paiement');
    }
  }

  // ========== NOUVELLE MÉTHODE POUR FACTURE ==========
  async generateInvoice(paymentId: string, siteNom: string): Promise<any> {
    try {
      this.logger.log(`📄 Génération facture pour paiement: ${paymentId}, site: ${siteNom}`);
      
      const response = await firstValueFrom(
        this.httpService.post(`${this.FACTURE_API_URL}/${paymentId}`, { siteNom })
      );

      this.logger.log(`✅ Facture générée: ${response.data.numeroFacture}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`❌ Erreur génération facture: ${error.message}`);
      // Ne pas bloquer le paiement si la facture échoue
      return null;
    }
  }
}