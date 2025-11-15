import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUser, Role, UpdateUser, User } from '../models';

@Injectable()
export class UserService {
  async create(user: CreateUser): Promise<User> {}

  async findById(id: string): Promise<User | null> {}

  async findByEmail(email: string): Promise<User | null> {}

  async findByMembershipId(membershipId: string): Promise<User | null> {}

  async findByBatch(batch: string): Promise<User[]> {}

  async update(id: string, updates: Partial<UpdateUser>): Promise<User> {}

  async updatePassword(id: string, newPassword: string): Promise<void> {}

  async updateRole(id: string, newRole: Role): Promise<User> {}

  async updatePhoto(id: string, photo: File): Promise<User> {}

  async block(id: string): Promise<void> {}

  async unblock(id: string): Promise<void> {}

  async assignMembershipId(id: string): Promise<User> {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }

    const batch = user.batch;

    if (!batch) {
      throw new BadRequestException(
        `User batch information is missing for id: ${id}`,
      );
    }

    const shift = batch.charAt(0); // Assuming batch format is like 'D-42'. Either 'D' or 'E'

    if (shift !== 'D' && shift !== 'E') {
      throw new UnprocessableEntityException(
        `Invalid batch format for user id: ${id}. Expected format 'D-XX' or 'E-XX'.`,
      );
    }

    const batchNumber = batch.split('-')[1];
    if (!batchNumber) {
      throw new UnprocessableEntityException(
        `Invalid batch format for user id: ${id}. Expected format 'D-XX' or 'E-XX'.`,
      );
    }

    const usersInSameBatch = await this.findByBatch(batch);
    const membersInBatch = usersInSameBatch.filter((u) => u.membershipId);
    const sequenceNumber = (membersInBatch.length + 1)
      .toString()
      .padStart(3, '0');

    const membershipId = `${currentYear}${shift}${batchNumber}${sequenceNumber}`;

    // ie. 25D42001: YearOfJoining + Shift + Batch + Sequence_Number_3Digits
    const patternMatched = /^[0-9]{2}[DE][0-9]{2}[0-9]{3}$/.test(membershipId);
    if (!patternMatched) {
      throw new UnprocessableEntityException(
        `Generated membership ID ${membershipId} does not match the required pattern for user id: ${id}.`,
      );
    }

    const exists = await this.findByMembershipId(membershipId);
    if (exists) {
      throw new ConflictException(
        `Membership ID conflict for user id: ${id}. Generated membership ID ${membershipId} already exists.`,
      );
    }

    user.membershipId = membershipId;
    // Persist the updated user with membershipId
    // await this.userRepository.save(user);

    return user;
  }
}
