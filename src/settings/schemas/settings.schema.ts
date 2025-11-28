import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingsDocument = Settings & Document;

@Schema({ timestamps: true })
export class Settings {
  @Prop({ required: true, unique: true, trim: true })
  key: string;

  @Prop({ required: true, type: Object })
  value: Record<string, unknown>;

  @Prop({ default: null, trim: true })
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);

// Index for fast key lookup
SettingsSchema.index({ key: 1 });
