import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { MembershipRequestService } from './membership-request.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateMembershipStatusDto } from './dto/membership-request.dto';
import { MembershipStatus } from './enums/membership-status.enum';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('api/membership-request')
export class MembershipRequestController {
  constructor(
    private readonly membershipRequestService: MembershipRequestService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createMembershipRequest(@Request() req: RequestWithUser) {
    return this.membershipRequestService.createMembershipRequest(
      req.user.userId,
    );
  }

  @Get('my-request')
  @UseGuards(JwtAuthGuard)
  async getMyMembershipRequest(@Request() req: RequestWithUser) {
    return this.membershipRequestService.getMembershipRequest(req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllMembershipRequests(@Query('status') status?: MembershipStatus) {
    return this.membershipRequestService.getAllMembershipRequests(status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getMembershipRequestById(@Param('id') id: string) {
    return this.membershipRequestService.getMembershipRequestById(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateMembershipStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateMembershipStatusDto,
    @Request() req: RequestWithUser,
  ) {
    return this.membershipRequestService.updateMembershipStatus(
      id,
      updateDto,
      req.user.userId,
    );
  }

  @Post(':id/payment/verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(
    @Param('id') id: string,
    @Body('transactionId') transactionId: string,
  ) {
    return this.membershipRequestService.updatePaymentStatus(id, transactionId);
  }
}
