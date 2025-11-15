import { User } from '../models';
import { UserDocument } from '../schemas';

export function toUser(doc: UserDocument, withHash: boolean = false): User {
  return {
    id: doc._id.toString(),
    email: doc.email,
    role: doc.role,
    emailVerified: doc.emailVerified,
    blocked: doc.blocked,
    name: doc.name,
    batch: doc.batch,
    photo: doc.photo,
    membershipId: doc.membershipId,
    googleId: doc.googleId,
    hash: withHash ? doc.hash : undefined,
    emailVerificationToken: doc.emailVerificationToken,
    emailVerificationExpires: doc.emailVerificationExpires,
    passwordResetToken: doc.passwordResetToken,
    passwordResetExpires: doc.passwordResetExpires,
  };
}
