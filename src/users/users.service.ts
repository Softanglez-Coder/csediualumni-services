import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
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
}
