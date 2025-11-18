import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembershipRequestController } from './membership-request.controller';
import { MembershipRequestService } from './membership-request.service';
import {
  MembershipRequest,
  MembershipRequestSchema,
} from './schemas/membership-request.schema';
import { UsersModule } from '../users/users.module';
import { PaymentModule } from '../payment/payment.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MembershipRequest.name, schema: MembershipRequestSchema },
    ]),
    UsersModule,
    PaymentModule,
    MailModule,
  ],
  controllers: [MembershipRequestController],
  providers: [MembershipRequestService],
  exports: [MembershipRequestService],
})
export class MembershipRequestModule {}
