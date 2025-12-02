import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserProfileDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /**
   * Find or create user from Auth0 JWT payload
   * Called automatically on first login
   */
  async findOrCreate(auth0Payload: any): Promise<User> {
    const { sub, email, name, picture, email_verified } = auth0Payload;

    let user = await this.userModel.findOne({ auth0Id: sub });

    if (!user) {
      user = await this.userModel.create({
        auth0Id: sub,
        email,
        name,
        picture,
        emailVerified: email_verified,
        lastLoginAt: new Date(),
      });
    } else {
      // Update last login and basic info from Auth0
      user.lastLoginAt = new Date();
      user.name = name || user.name;
      user.picture = picture || user.picture;
      user.emailVerified = email_verified;
      await user.save();
    }

    return user;
  }

  /**
   * Get user by Auth0 ID
   */
  async findByAuth0Id(auth0Id: string): Promise<User> {
    const user = await this.userModel.findOne({ auth0Id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Get user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email });
  }

  /**
   * Update user profile
   */
  async updateProfile(
    auth0Id: string,
    updateDto: UpdateUserProfileDto,
  ): Promise<User> {
    const user = await this.userModel.findOneAndUpdate(
      { auth0Id },
      { $set: updateDto },
      { new: true, runValidators: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Get all users with filters
   */
  async findAll(filters?: {
    graduationYear?: number;
    batch?: string;
    roles?: string[];
  }): Promise<User[]> {
    const query: any = { isActive: true };

    if (filters?.graduationYear) {
      query.graduationYear = filters.graduationYear;
    }
    if (filters?.batch) {
      query.batch = filters.batch;
    }
    if (filters?.roles && filters.roles.length > 0) {
      query.roles = { $in: filters.roles };
    }

    return this.userModel.find(query).select('-__v').sort({ createdAt: -1 });
  }

  /**
   * Search users by name or email
   */
  async search(searchTerm: string): Promise<User[]> {
    return this.userModel
      .find({
        isActive: true,
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
        ],
      })
      .select('-__v')
      .limit(20);
  }

  /**
   * Delete user (soft delete)
   */
  async remove(auth0Id: string): Promise<void> {
    const result = await this.userModel.updateOne(
      { auth0Id },
      { isActive: false },
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundException('User not found');
    }
  }
}
