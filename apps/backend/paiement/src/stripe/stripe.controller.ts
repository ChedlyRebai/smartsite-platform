import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

class CreatePaymentIntentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

@Controller('api/payments/stripe')
export class StripeController {
  constructor(private stripeService: StripeService) {}

  /** Returns a clientSecret that the frontend uses with Stripe Elements */
  @Post('create-payment-intent')
  @UseGuards()  // Explicitly disable JWT auth - Stripe API already secures the payment
  async createPaymentIntent(@Body() body: CreatePaymentIntentDto) {
    return this.stripeService.createPaymentIntent(
      body.amount,
      body.currency || 'eur',
      body.description || '',
    );
  }
}