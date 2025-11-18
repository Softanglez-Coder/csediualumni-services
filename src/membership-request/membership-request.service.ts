import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MembershipRequest,
  MembershipRequestDocument,
} from './schemas/membership-request.schema';
import { MembershipStatus } from './enums/membership-status.enum';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { UpdateMembershipStatusDto } from './dto/membership-request.dto';
import { PaymentService } from '../payment/payment.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class MembershipRequestService {
  constructor(
    @InjectModel(MembershipRequest.name)
    private membershipRequestModel: Model<MembershipRequestDocument>,
    private usersService: UsersService,
    private paymentService: PaymentService,
    private mailService: MailService,
  ) {}

  private isProfileComplete(user: UserDocument): boolean {
    // Check all required fields for 100% profile completion
    return !!(
      user.firstName &&
      user.lastName &&
      user.email &&
      user.profilePicture &&
      user.phoneNumber &&
      user.batch &&
      user.dateOfBirth &&
      user.company &&
      user.designation &&
      user.passingYear &&
      user.educationLevel
    );
  }

  async createMembershipRequest(
    userId: string,
  ): Promise<MembershipRequestDocument> {
    // Get user details
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if profile is 100% complete
    if (!this.isProfileComplete(user)) {
      throw new BadRequestException(
        'Profile must be 100% complete to submit membership request. Please ensure all required fields are filled: Name, Photo, Email, Phone number, Batch, Date of Birth, Company, Designation, Passing Year, and Education Level.',
      );
    }

    // Check if user already has a pending/approved membership request
    const existingRequest = await this.membershipRequestModel.findOne({
      userId,
      status: {
        $in: [
          MembershipStatus.DRAFT,
          MembershipStatus.INFORMATION_VERIFIED,
          MembershipStatus.PAYMENT_REQUIRED,
          MembershipStatus.APPROVED,
        ],
      },
    });

    if (existingRequest) {
      throw new ConflictException(
        'You already have an active membership request',
      );
    }

    // Create new membership request in draft status
    const membershipRequest = new this.membershipRequestModel({
      userId,
      status: MembershipStatus.DRAFT,
      statusHistory: [
        {
          status: MembershipStatus.DRAFT,
          changedAt: new Date(),
          changedBy: userId,
          note: 'Membership request submitted',
        },
      ],
    });

    const savedRequest = await membershipRequest.save();

    // Send confirmation email
    await this.mailService.sendMembershipStatusEmail(
      user.email,
      user.firstName,
      MembershipStatus.DRAFT,
    );

    return savedRequest;
  }

  async getMembershipRequest(
    userId: string,
  ): Promise<MembershipRequestDocument | null> {
    return this.membershipRequestModel.findOne({ userId }).exec();
  }

  async getMembershipRequestById(
    requestId: string,
  ): Promise<MembershipRequestDocument | null> {
    return this.membershipRequestModel.findById(requestId).exec();
  }

  async getAllMembershipRequests(
    status?: MembershipStatus,
  ): Promise<MembershipRequestDocument[]> {
    const query = status ? { status } : {};
    return this.membershipRequestModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateMembershipStatus(
    requestId: string,
    updateDto: UpdateMembershipStatusDto,
    adminUserId: string,
  ): Promise<MembershipRequestDocument> {
    const request = await this.membershipRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Membership request not found');
    }

    const user = await this.usersService.findById(request.userId.toString());
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate status transition
    this.validateStatusTransition(request.status, updateDto.status);

    // Update status
    request.status = updateDto.status;

    // Handle rejection
    if (
      updateDto.status === MembershipStatus.REJECTED &&
      updateDto.rejectionReason
    ) {
      request.rejectionReason = updateDto.rejectionReason;
    }

    // Handle payment requirement
    if (
      updateDto.status === MembershipStatus.PAYMENT_REQUIRED &&
      updateDto.paymentAmount
    ) {
      request.paymentAmount = updateDto.paymentAmount;

      // Generate payment URL
      const paymentGateway = this.paymentService.getGateway();
      const paymentResponse = await paymentGateway.initiatePayment({
        amount: updateDto.paymentAmount,
        currency: 'BDT',
        orderId: `MBR-${String(request._id)}`,
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email,
        customerPhone: user.phoneNumber || 'N/A',
        description: 'CSE DIU Alumni Membership Fee',
      });

      if (paymentResponse.success && paymentResponse.paymentUrl) {
        request.paymentUrl = paymentResponse.paymentUrl;
        request.paymentTransactionId = paymentResponse.transactionId;
      }
    }

    // Add to status history
    request.statusHistory.push({
      status: updateDto.status,
      changedAt: new Date(),
      changedBy: adminUserId,
      note: updateDto.note,
    });

    const updatedRequest = await request.save();

    // Send status update email
    await this.mailService.sendMembershipStatusEmail(
      user.email,
      user.firstName,
      updateDto.status,
      updateDto.rejectionReason,
      request.paymentUrl,
    );

    return updatedRequest;
  }

  private validateStatusTransition(
    currentStatus: MembershipStatus,
    newStatus: MembershipStatus,
  ): void {
    // Cannot change status if already approved
    if (currentStatus === MembershipStatus.APPROVED) {
      throw new BadRequestException('Cannot change status of approved request');
    }

    // Define valid transitions
    const validTransitions: Record<MembershipStatus, MembershipStatus[]> = {
      [MembershipStatus.DRAFT]: [
        MembershipStatus.INFORMATION_VERIFIED,
        MembershipStatus.REJECTED,
      ],
      [MembershipStatus.INFORMATION_VERIFIED]: [
        MembershipStatus.PAYMENT_REQUIRED,
        MembershipStatus.APPROVED,
        MembershipStatus.REJECTED,
      ],
      [MembershipStatus.PAYMENT_REQUIRED]: [
        MembershipStatus.APPROVED,
        MembershipStatus.REJECTED,
      ],
      [MembershipStatus.APPROVED]: [],
      [MembershipStatus.REJECTED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  async updatePaymentStatus(
    requestId: string,
    transactionId: string,
  ): Promise<MembershipRequestDocument> {
    const request = await this.membershipRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Membership request not found');
    }

    // Verify payment with gateway
    const paymentGateway = this.paymentService.getGateway();
    const verificationResponse = await paymentGateway.verifyPayment({
      transactionId,
    });

    if (!verificationResponse.success) {
      throw new BadRequestException('Payment verification failed');
    }

    request.paymentStatus = verificationResponse.status;
    request.paymentTransactionId = transactionId;

    return request.save();
  }
}
