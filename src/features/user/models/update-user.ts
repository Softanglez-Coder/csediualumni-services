export class UpdateUser {
  name?: string;
  batch?: string;
  photo?: string;
  googleId?: string;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}
