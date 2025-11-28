import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UserRole } from '../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    authProvider: string = 'local',
  ): Promise<UserDocument> {
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = new this.userModel({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      authProvider,
      emailVerificationToken,
      emailVerificationExpires,
      isEmailVerified: authProvider === 'google', // Google users are pre-verified
    });

    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  async findByVerificationToken(token: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      })
      .exec();
  }

  async verifyEmail(token: string): Promise<UserDocument> {
    const user = await this.findByVerificationToken(token);
    if (!user) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    return user.save();
  }

  async createVerificationToken(userId: string): Promise<string> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    return token;
  }

  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async createOrUpdateGoogleUser(
    googleId: string,
    email: string,
    firstName: string,
    lastName: string,
    profilePicture?: string,
  ): Promise<UserDocument> {
    let user = await this.findByGoogleId(googleId);

    if (user) {
      // Update existing user
      user.firstName = firstName;
      user.lastName = lastName;
      user.profilePicture = profilePicture;
      return user.save();
    }

    // Check if user exists with this email
    user = await this.findByEmail(email);
    if (user) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.profilePicture = profilePicture;
      user.isEmailVerified = true;
      return user.save();
    }

    // Create new user
    user = new this.userModel({
      email,
      firstName,
      lastName,
      googleId,
      profilePicture,
      authProvider: 'google',
      isEmailVerified: true,
    });

    return user.save();
  }

  async ensureSystemAdminExists(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<UserDocument> {
    let systemAdmin = await this.userModel
      .findOne({ email: email.toLowerCase(), isSystemBot: true })
      .exec();

    if (systemAdmin) {
      // Update password if it has changed
      const hashedPassword = await bcrypt.hash(password, 10);
      if (systemAdmin.password !== hashedPassword) {
        systemAdmin.password = hashedPassword;
      }
      // Ensure system admin always has correct settings
      systemAdmin.firstName = firstName;
      systemAdmin.lastName = lastName;
      systemAdmin.isActive = true;
      systemAdmin.isEmailVerified = true;
      systemAdmin.roles = [UserRole.SYSTEM_ADMIN];
      return systemAdmin.save();
    }

    // Create new system admin bot user
    const hashedPassword = await bcrypt.hash(password, 10);
    systemAdmin = new this.userModel({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      authProvider: 'local',
      isEmailVerified: true,
      isActive: true,
      isSystemBot: true,
      roles: [UserRole.SYSTEM_ADMIN],
    });

    return systemAdmin.save();
  }

  /**
   * Generates a unique membership ID following the pattern M<5 digits>
   * @returns A unique membership ID string (e.g., M00001, M00002, etc.)
   */
  private async generateMembershipId(): Promise<string> {
    // Find the highest existing membership ID
    const lastMember = await this.userModel
      .findOne({ membershipId: { $ne: null } })
      .sort({ membershipId: -1 })
      .exec();

    let nextSequence = 1;
    if (lastMember?.membershipId) {
      // Extract the numeric part from the membership ID (e.g., "M00001" -> 1)
      const numericPart = parseInt(lastMember.membershipId.substring(1), 10);
      nextSequence = numericPart + 1;
    }

    // Format as M followed by 5-digit zero-padded number
    return `M${nextSequence.toString().padStart(5, '0')}`;
  }

  /**
   * Adds the Member role to a user and generates a membership ID
   * Called when a membership request is approved
   * @param userId - The ID of the user to update
   * @returns The updated user document
   */
  async approveMembership(userId: string): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Add Member role if not already present
    if (!user.roles.includes(UserRole.MEMBER)) {
      user.roles.push(UserRole.MEMBER);
    }

    // Generate and assign membership ID if not already assigned
    if (!user.membershipId) {
      user.membershipId = await this.generateMembershipId();
    }

    return user.save();
  }
}
