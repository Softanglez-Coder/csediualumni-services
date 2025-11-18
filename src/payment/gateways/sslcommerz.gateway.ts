import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentGateway,
  PaymentInitiateRequest,
  PaymentInitiateResponse,
  PaymentVerificationRequest,
  PaymentVerificationResponse,
} from '../interfaces/payment-gateway.interface';

@Injectable()
export class SslcommerzGateway implements IPaymentGateway {
  private readonly logger = new Logger(SslcommerzGateway.name);
  private readonly storeId: string;
  private readonly storePassword: string;
  private readonly apiUrl: string;
  private readonly isSandbox: boolean;

  constructor(private configService: ConfigService) {
    this.storeId =
      this.configService.get<string>('payment.sslcommerz.storeId') || '';
    this.storePassword =
      this.configService.get<string>('payment.sslcommerz.storePassword') || '';
    this.isSandbox =
      this.configService.get<boolean>('payment.sslcommerz.sandbox') ?? true;
    this.apiUrl = this.isSandbox
      ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
      : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';
  }

  async initiatePayment(
    request: PaymentInitiateRequest,
  ): Promise<PaymentInitiateResponse> {
    try {
      // Prepare SSLCommerz payment data
      const paymentData: Record<string, string> = {
        store_id: this.storeId,
        store_passwd: this.storePassword,
        total_amount: request.amount.toString(),
        currency: request.currency || 'BDT',
        tran_id: request.orderId,
        success_url:
          request.successUrl ||
          `${this.configService.get<string>('frontend.url')}/payment/success`,
        fail_url:
          request.failUrl ||
          `${this.configService.get<string>('frontend.url')}/payment/fail`,
        cancel_url:
          request.cancelUrl ||
          `${this.configService.get<string>('frontend.url')}/payment/cancel`,
        ipn_url: `${this.configService.get<string>('api.url')}/api/payment/ipn`,
        cus_name: request.customerName,
        cus_email: request.customerEmail,
        cus_phone: request.customerPhone,
        cus_add1: 'N/A',
        cus_city: 'N/A',
        cus_country: 'Bangladesh',
        product_name: request.description || 'Membership Fee',
        product_category: 'Membership',
        product_profile: 'general',
        shipping_method: 'NO',
      };

      this.logger.log(`Initiating payment for order: ${request.orderId}`);

      // Make API call to SSLCommerz
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(paymentData).toString(),
      });

      const result = (await response.json()) as {
        status?: string;
        GatewayPageURL?: string;
        sessionkey?: string;
        failedreason?: string;
      };

      if (result.status === 'SUCCESS' && result.GatewayPageURL) {
        this.logger.log(
          `Payment initiated successfully for order: ${request.orderId}`,
        );
        return {
          success: true,
          paymentUrl: result.GatewayPageURL,
          transactionId: result.sessionkey,
          message: 'Payment session created successfully',
        };
      } else {
        this.logger.error(
          `Payment initiation failed: ${result.failedreason || 'Unknown error'}`,
        );
        return {
          success: false,
          error: result.failedreason || 'Payment initiation failed',
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Payment initiation error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage || 'Payment initiation failed',
      };
    }
  }

  async verifyPayment(
    request: PaymentVerificationRequest,
  ): Promise<PaymentVerificationResponse> {
    try {
      const validationUrl = this.isSandbox
        ? 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
        : 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php';

      const validationData = {
        val_id: request.transactionId,
        store_id: this.storeId,
        store_passwd: this.storePassword,
      };

      this.logger.log(`Verifying payment: ${request.transactionId}`);

      const response = await fetch(validationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(validationData).toString(),
      });

      const result = (await response.json()) as {
        status?: string;
        tran_id?: string;
        amount?: string;
        tran_date?: string;
      };

      if (result.status === 'VALID' || result.status === 'VALIDATED') {
        this.logger.log(
          `Payment verified successfully: ${request.transactionId}`,
        );
        return {
          success: true,
          transactionId: result.tran_id || request.transactionId,
          amount: result.amount ? parseFloat(result.amount) : 0,
          status: result.status,
          paymentDate: result.tran_date
            ? new Date(result.tran_date)
            : undefined,
          message: 'Payment verified successfully',
        };
      } else {
        this.logger.warn(
          `Payment verification failed: ${result.status || 'INVALID'}`,
        );
        return {
          success: false,
          transactionId: request.transactionId,
          amount: 0,
          status: result.status || 'INVALID',
          error: 'Payment verification failed',
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Payment verification error: ${errorMessage}`);
      return {
        success: false,
        transactionId: request.transactionId,
        amount: 0,
        status: 'ERROR',
        error: errorMessage || 'Payment verification failed',
      };
    }
  }
}
