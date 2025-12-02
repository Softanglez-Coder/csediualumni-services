import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IssueStatus } from '../enums/issue-status.enum';

export type IssueDocument = Issue & Document;

@Schema({ timestamps: true })
export class Issue {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: String, enum: IssueStatus, default: IssueStatus.OPEN })
  status: IssueStatus;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  resolvedBy?: string;

  @Prop()
  notes?: string;
}

export const IssueSchema = SchemaFactory.createForClass(Issue);
