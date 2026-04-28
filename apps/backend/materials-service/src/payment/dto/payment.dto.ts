export class CreatePaymentRequestDto {
  siteId: string;
  amount: number;
  paymentMethod: 'cash' | 'card';
  description?: string;
}

export class PaymentResponseDto {
  success: boolean;
  paymentId: string;
  status: string;
  amount: number;
  paymentMethod: string;
  message: string;
  clientSecret?: string;
}