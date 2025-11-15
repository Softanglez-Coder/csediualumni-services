import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../models';

@Schema({
  collection: 'users',
  timestamps: true,
})
export class UserEntity {
  @Prop({
    unique: true,
    required: true,
    maxLength: 255,
    minLength: 5,
    type: String,
  })
  email: string;

  @Prop({
    required: true,
    default: Role.GUEST,
    enum: Object.values(Role),
    type: String,
  })
  role: Role;

  @Prop({
    required: false,
    type: String,
  })
  hash?: string;

  @Prop({
    required: true,
    default: false,
    type: Boolean,
  })
  blocked: boolean;

  @Prop({
    required: true,
    default: false,
    type: Boolean,
  })
  emailVerified: boolean;

  @Prop({
    type: String,
  })
  emailVerificationToken?: string;

  @Prop({
    type: Date,
  })
  emailVerificationExpires?: Date;

  @Prop({
    type: String,
  })
  passwordResetToken?: string;

  @Prop({
    type: Date,
  })
  passwordResetExpires?: Date;

  @Prop({
    type: String,
  })
  googleId?: string;

  @Prop({
    maxLength: 100,
    minLength: 2,
    type: String,
  })
  name?: string;

  @Prop({
    maxLength: 6,
    minLength: 3,
    type: String,
  })
  batch?: string;

  @Prop({
    type: String,
  })
  photo?: string;

  @Prop({
    unique: true,
    sparse: true,
    type: String,
  })
  membershipId?: string;
}

export type UserDocument = HydratedDocument<UserEntity>;
export const UserSchema = SchemaFactory.createForClass(UserEntity);
