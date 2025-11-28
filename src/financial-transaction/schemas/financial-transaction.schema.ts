import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

export type FinancialTransactionDocument = FinancialTransaction & Document;

@Schema({ timestamps: true })
export class FinancialTransaction {
  @Prop({
    type: String,
    enum: Object.values(TransactionType),
    required: true,
  })
  type: TransactionType;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ default: 'BDT' })
  currency: string;

  @Prop({ default: null, trim: true })
  category?: string;

  @Prop({ default: null, trim: true })
  referenceNumber?: string;

  @Prop({ type: Date, required: true })
  transactionDate: Date;

  @Prop({
    type: String,
    enum: Object.values(TransactionStatus),
    default: TransactionStatus.DRAFT,
  })
  status: TransactionStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reviewedBy?: Types.ObjectId;

  @Prop({ default: null })
  reviewedAt?: Date;

  @Prop({ default: null, trim: true })
  reviewNote?: string;

  @Prop({ default: null, trim: true })
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

  @Prop({ default: null })
  attachmentUrl?: string;

  @Prop({ default: null, trim: true })
  payee?: string;

  @Prop({ default: null, trim: true })
  payer?: string;
}

export const FinancialTransactionSchema =
  SchemaFactory.createForClass(FinancialTransaction);

// Indexes for better query performance
FinancialTransactionSchema.index({ type: 1 });
FinancialTransactionSchema.index({ status: 1 });
FinancialTransactionSchema.index({ createdBy: 1 });
FinancialTransactionSchema.index({ transactionDate: -1 });
FinancialTransactionSchema.index({ category: 1 });
