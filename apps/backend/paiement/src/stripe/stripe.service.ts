import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const Stripe = require('stripe');

@Injectable()
export class StripeService {
  private stripe: any;

  constructor(private configService: ConfigService) {
    // STRIPE_SECRET_KEY must be set in environment variables
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    this.stripe = Stripe(secretKey);
  }

  /**
   * Creates a Stripe PaymentIntent and returns the clientSecret.
   * The frontend uses the clientSecret with Stripe Elements to collect
   * card details directly — sensitive data never touches our server.
   *
   * @param amount   Payment amount in the smallest currency unit (e.g. cents for EUR)
   * @param currency ISO 4217 currency code, default 'eur'
   * @param description  Human-readable description shown in Stripe dashboard
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'eur',
    description: string = '',
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Stripe requires the amount in the smallest currency unit (cents)
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      description,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }
}
