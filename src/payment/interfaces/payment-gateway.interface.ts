export interface PaymentInitiateRequest {
  amount: number;
  currency?: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description?: string;
  successUrl?: string;
  failUrl?: string;
  cancelUrl?: string;
}

export interface PaymentInitiateResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  message?: string;
  error?: string;
}

export interface PaymentVerificationRequest {
  transactionId: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  transactionId: string;
  amount: number;
  status: string;
  paymentDate?: Date;
  message?: string;
  error?: string;
}

export interface IPaymentGateway {
  initiatePayment(
    request: PaymentInitiateRequest,
  ): Promise<PaymentInitiateResponse>;
  verifyPayment(
    request: PaymentVerificationRequest,
  ): Promise<PaymentVerificationResponse>;
}
