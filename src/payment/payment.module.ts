import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { SslcommerzGateway } from './gateways/sslcommerz.gateway';

@Module({
  providers: [PaymentService, SslcommerzGateway],
  exports: [PaymentService],
})
export class PaymentModule {}
