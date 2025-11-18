import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MembershipStatus } from '../enums/membership-status.enum';

export type MembershipRequestDocument = MembershipRequest & Document;

@Schema({ timestamps: true })
export class MembershipRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(MembershipStatus),
    default: MembershipStatus.DRAFT,
  })
  status: MembershipStatus;

  @Prop({ default: null })
  paymentUrl?: string;

  @Prop({ default: null })
  paymentTransactionId?: string;

  @Prop({ default: null })
  paymentAmount?: number;

  @Prop({ default: null })
  paymentStatus?: string;

  @Prop({ default: null })
  rejectionReason?: string;

  @Prop({
    type: [
      { status: String, changedAt: Date, changedBy: String, note: String },
    ],
    default: [],
  })
  statusHistory: Array<{
    status: string;
    changedAt: Date;
    changedBy: string;
    note?: string;
  }>;
}

export const MembershipRequestSchema =
  SchemaFactory.createForClass(MembershipRequest);

// Indexes for better query performance
MembershipRequestSchema.index({ userId: 1 });
MembershipRequestSchema.index({ status: 1 });
MembershipRequestSchema.index({ createdAt: -1 });
