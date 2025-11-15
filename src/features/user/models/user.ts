import { Role } from './role';

export class User {
  id!: string;
  email!: string;
  role!: Role;
  blocked!: boolean;
  emailVerified!: boolean;

  name?: string;
  batch?: string; // D-42: Shift-BatchNumber
  photo?: string;
  membershipId?: string; // 25D42001: YearOfJoining + Shift + Batch + Sequence_Number_3Digits
  googleId?: string;

  // sensitive fields excluded for security reasons
  // but can be included when necessary
  hash?: string;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}
