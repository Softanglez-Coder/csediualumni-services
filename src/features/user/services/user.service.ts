import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUser, Role, UpdateUser, User } from '../models';
import { UserRepository } from '../repositories';
import { UserEntity } from '../schemas';
import { toUser } from '../utils';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(user: CreateUser, hash: string): Promise<User> {
    if (!user || !hash) {
      throw new BadRequestException('Invalid user data or password hash');
    }

    const exists = await this.userRepository.findByEmail(user.email);
    if (exists) {
      throw new ConflictException(
        `User already exists with email: ${user.email}`,
      );
    }

    const entity: UserEntity = {
      email: user.email,
      hash: hash,
      role: Role.GUEST,
      blocked: false,
      emailVerified: false,
      name: user.email.split('@')[0],
    };

    const createdUser = await this.userRepository.create(entity);

    if (!createdUser) {
      throw new UnprocessableEntityException('Failed to create user');
    }

    const newUser: User = toUser(createdUser);
    return newUser;
  }

  async findById(id: string): Promise<User | null> {
    const userDocument = await this.userRepository.findById(id);
    if (!userDocument) {
      return null;
    }

    const user: User = toUser(userDocument);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userDocument = await this.userRepository.findByEmail(email);
    if (!userDocument) {
      return null;
    }

    const user: User = toUser(userDocument);
    return user;
  }

  async findByMembershipId(membershipId: string): Promise<User | null> {
    const userDocument =
      await this.userRepository.findByMembershipId(membershipId);
    if (!userDocument) {
      return null;
    }
    const user: User = toUser(userDocument);
    return user;
  }

  async findByBatch(batch: string): Promise<User[]> {
    const userDocuments = await this.userRepository.findByBatch(batch);
    const users: User[] = userDocuments.map((doc) => toUser(doc));
    return users;
  }

  async update(id: string, updates: Partial<UpdateUser>): Promise<User> {
    const updatedDocument = await this.userRepository.update(id, updates);
    if (!updatedDocument) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }
    const updatedUser: User = toUser(updatedDocument);
    return updatedUser;
  }

  async updatePassword(id: string, hash: string): Promise<void> {
    const updatedDocument = await this.userRepository.updateHash(id, hash);
    if (!updatedDocument) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }

    return;
  }

  async updateRole(id: string, newRole: Role): Promise<User> {
    const updatedDocument = await this.userRepository.updateRole(id, newRole);
    if (!updatedDocument) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }

    const updatedUser: User = toUser(updatedDocument);
    return updatedUser;
  }

  async updatePhoto(id: string, photo: File): Promise<User> {
    // TODO: handle file upload to storage service and get the URL or path
    const url = `path/to/uploaded/${photo.name}`;
    const updatedDocument = await this.userRepository.updatePhoto(id, url);
    if (!updatedDocument) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }

    const updatedUser: User = toUser(updatedDocument);
    return updatedUser;
  }

  async block(id: string): Promise<void> {
    const updatedDocument = await this.userRepository.block(id);
    if (!updatedDocument) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }

    return;
  }

  async unblock(id: string): Promise<void> {
    const updatedDocument = await this.userRepository.unblock(id);
    if (!updatedDocument) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }

    return;
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    const userDocument =
      await this.userRepository.findByEmailVerificationToken(token);
    if (!userDocument) {
      return null;
    }
    const user: User = toUser(userDocument);
    return user;
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    const userDocument =
      await this.userRepository.findByPasswordResetToken(token);
    if (!userDocument) {
      return null;
    }
    const user: User = toUser(userDocument);
    return user;
  }

  async verifyEmail(id: string): Promise<User> {
    const userDocument = await this.userRepository.verifyEmail(id);
    if (!userDocument) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }
    const user: User = toUser(userDocument);
    return user;
  }

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
    const patternMatched = /^[0-9]{2}[DE][0-9]{4}[0-9]{3}$/.test(membershipId);
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
