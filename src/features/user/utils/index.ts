import { User } from '../models';
import { UserDocument } from '../schemas';

export function toUser(doc: UserDocument, withHash: boolean = false): User {
  return {
    id: doc._id.toString(),
    email: doc.email,
    role: doc.role,
    name: doc.name,
    batch: doc.batch,
    photo: doc.photo,
    membershipId: doc.membershipId,
    blocked: doc.blocked,
    hash: withHash ? doc.hash : undefined,
  };
}
