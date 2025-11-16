import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: false })
  password?: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: null })
  emailVerificationToken?: string;

  @Prop({ default: null })
  emailVerificationExpires?: Date;

  @Prop({ default: null })
  passwordResetToken?: string;

  @Prop({ default: null })
  passwordResetExpires?: Date;

  @Prop({ enum: ['local', 'google'], default: 'local' })
  authProvider: string;

  @Prop({ default: null })
  googleId?: string;

  @Prop({ default: null })
  profilePicture?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: [String],
    enum: Object.values(UserRole),
    default: [UserRole.GUEST],
  })
  roles: UserRole[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ emailVerificationToken: 1 });
