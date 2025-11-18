import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentGateway } from './interfaces/payment-gateway.interface';
import { SslcommerzGateway } from './gateways/sslcommerz.gateway';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly gateway: IPaymentGateway;

  constructor(
    private configService: ConfigService,
    private sslcommerzGateway: SslcommerzGateway,
  ) {
    // For now, default to SSLCommerz. This can be extended to support multiple gateways
    const selectedGateway =
      this.configService.get<string>('payment.gateway') || 'sslcommerz';

    if (selectedGateway === 'sslcommerz') {
      this.gateway = this.sslcommerzGateway;
    } else {
      // Default to SSLCommerz if unknown gateway
      this.gateway = this.sslcommerzGateway;
    }

    this.logger.log(`Payment gateway initialized: ${selectedGateway}`);
  }

  getGateway(): IPaymentGateway {
    return this.gateway;
  }
}
