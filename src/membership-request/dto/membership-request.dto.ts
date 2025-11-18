import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { MembershipStatus } from '../enums/membership-status.enum';

export class CreateMembershipRequestDto {
  // No fields needed - request is created from authenticated user's profile
}

export class UpdateMembershipStatusDto {
  @IsEnum(MembershipStatus)
  status: MembershipStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsNumber()
  paymentAmount?: number;
}

export class UpdatePaymentDto {
  @IsString()
  transactionId: string;

  @IsString()
  paymentStatus: string;
}
