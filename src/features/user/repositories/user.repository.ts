import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserEntity } from '../schemas';
import { Model } from 'mongoose';
import { Role } from '../models';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
  ) {}

  async create(user: Partial<UserEntity>) {
    const newUser = new this.userModel(user);
    return newUser.save();
  }

  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async findByMembershipId(membershipId: string) {
    return this.userModel.findOne({ membershipId }).exec();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async findByBatch(batch: string) {
    return this.userModel.find({ batch }).exec();
  }

  async update(id: string, updates: Partial<UserEntity>) {
    return this.userModel.findByIdAndUpdate(id, updates, { new: true }).exec();
  }

  async updateHash(id: string, hash: string) {
    return this.userModel.findByIdAndUpdate(id, { hash }, { new: true }).exec();
  }

  async updateRole(id: string, role: Role) {
    return this.userModel.findByIdAndUpdate(id, { role }, { new: true }).exec();
  }

  async updatePhoto(id: string, photo: string) {
    return this.userModel
      .findByIdAndUpdate(id, { photo }, { new: true })
      .exec();
  }

  async block(id: string) {
    return this.userModel
      .findByIdAndUpdate(id, { blocked: true }, { new: true })
      .exec();
  }

  async unblock(id: string) {
    return this.userModel
      .findByIdAndUpdate(id, { blocked: false }, { new: true })
      .exec();
  }

  async findByEmailVerificationToken(token: string) {
    return this.userModel
      .findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      })
      .exec();
  }

  async findByPasswordResetToken(token: string) {
    return this.userModel
      .findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      })
      .exec();
  }

  async verifyEmail(id: string) {
    return this.userModel
      .findByIdAndUpdate(
        id,
        {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
        { new: true },
      )
      .exec();
  }
}
