import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../enums/user.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  auth0Id: string; // The 'sub' claim from Auth0 JWT (e.g., 'auth0|123456')

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  name: string;

  @Prop()
  picture: string;

  @Prop({ default: false })
  emailVerified: boolean;

  // Alumni-specific fields (All users are from CSE department)
  @Prop()
  graduationYear: number;

  @Prop()
  batch: string; // Format: "D-42" or "E-42" (Day/Evening - batch number)

  @Prop()
  phone: string;

  @Prop()
  bio: string;

  @Prop()
  currentCompany: string;

  @Prop()
  currentPosition: string;

  @Prop()
  linkedinUrl: string;

  @Prop()
  githubUrl: string;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({
    type: [String],
    enum: Object.values(UserRole),
    default: [UserRole.GUEST],
  })
  roles: UserRole[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for better query performance
// Note: email and auth0Id indexes are created automatically by 'unique: true'
UserSchema.index({ graduationYear: 1, batch: 1 });
UserSchema.index({ roles: 1 });

// Auto-assign system admin role for official email
UserSchema.pre('save', function (next) {
  if (this.isNew && this.email === 'csediualumni.official@gmail.com') {
    this.roles = [UserRole.SYSTEM_ADMIN];
  }
  next();
});
