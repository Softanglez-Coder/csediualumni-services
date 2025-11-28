import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRequestService } from '../membership-request.service';
import { UsersService } from '../../users/users.service';
import { PaymentService } from '../../payment/payment.service';
import { MailService } from '../../mail/mail.service';
import { FinancialTransactionService } from '../../financial-transaction/financial-transaction.service';
import { getModelToken } from '@nestjs/mongoose';
import { MembershipRequest } from '../schemas/membership-request.schema';
import { MembershipStatus } from '../enums/membership-status.enum';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

describe('MembershipRequestService', () => {
  let service: MembershipRequestService;
  let usersService: UsersService;
  let paymentService: PaymentService;
  let mailService: MailService;
  let financialTransactionService: FinancialTransactionService;

  const mockCompleteUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    profilePicture: 'https://example.com/pic.jpg',
    phoneNumber: '+8801234567890',
    batch: '50',
    dateOfBirth: new Date('1995-01-01'),
    company: 'Tech Corp',
    designation: 'Software Engineer',
    passingYear: 2020,
    educationLevel: 'Bachelor',
  };

  const mockIncompleteUser = {
    _id: '507f1f77bcf86cd799439012',
    email: 'incomplete@example.com',
    firstName: 'Incomplete',
    lastName: 'User',
    profilePicture: null,
    phoneNumber: null,
  };

  const mockMembershipRequest = {
    _id: '507f1f77bcf86cd799439013',
    userId: '507f1f77bcf86cd799439011',
    status: MembershipStatus.DRAFT,
    statusHistory: [],
    save: jest.fn().mockResolvedValue(this),
  };

  const mockMembershipRequestModel = jest.fn().mockImplementation((dto) => ({
    ...dto,
    _id: '507f1f77bcf86cd799439013',
    save: jest.fn().mockResolvedValue({
      ...dto,
      _id: '507f1f77bcf86cd799439013',
    }),
  }));

  mockMembershipRequestModel.findOne = jest.fn();
  mockMembershipRequestModel.findById = jest.fn();
  mockMembershipRequestModel.find = jest.fn();

  const mockUsersService = {
    findById: jest.fn(),
    approveMembership: jest.fn(),
  };

  const mockPaymentService = {
    getGateway: jest.fn().mockReturnValue({
      initiatePayment: jest.fn().mockResolvedValue({
        success: true,
        paymentUrl: 'https://payment.example.com/pay',
        transactionId: 'TXN123',
      }),
      verifyPayment: jest.fn().mockResolvedValue({
        success: true,
        transactionId: 'TXN123',
        amount: 1000,
        status: 'VALID',
      }),
    }),
  };

  const mockMailService = {
    sendMembershipStatusEmail: jest.fn(),
  };

  const mockFinancialTransactionService = {
    createIncomeTransaction: jest.fn().mockResolvedValue({
      _id: '507f1f77bcf86cd799439014',
      type: 'income',
      amount: 1000,
      status: 'approved',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipRequestService,
        {
          provide: getModelToken(MembershipRequest.name),
          useValue: mockMembershipRequestModel,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: FinancialTransactionService,
          useValue: mockFinancialTransactionService,
        },
      ],
    }).compile();

    service = module.get<MembershipRequestService>(MembershipRequestService);
    usersService = module.get<UsersService>(UsersService);
    paymentService = module.get<PaymentService>(PaymentService);
    mailService = module.get<MailService>(MailService);
    financialTransactionService = module.get<FinancialTransactionService>(
      FinancialTransactionService,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMembershipRequest', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(
        service.createMembershipRequest('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if profile is incomplete', async () => {
      mockUsersService.findById.mockResolvedValue(mockIncompleteUser);

      await expect(
        service.createMembershipRequest('507f1f77bcf86cd799439012'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user already has active request', async () => {
      mockUsersService.findById.mockResolvedValue(mockCompleteUser);
      mockMembershipRequestModel.findOne.mockResolvedValue(
        mockMembershipRequest,
      );

      await expect(
        service.createMembershipRequest('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(ConflictException);
    });

    it('should create membership request with draft status', async () => {
      mockUsersService.findById.mockResolvedValue(mockCompleteUser);
      mockMembershipRequestModel.findOne.mockResolvedValue(null);

      const result = await service.createMembershipRequest(
        '507f1f77bcf86cd799439011',
      );

      expect(result).toBeDefined();
      expect(mockMailService.sendMembershipStatusEmail).toHaveBeenCalledWith(
        mockCompleteUser.email,
        mockCompleteUser.firstName,
        MembershipStatus.DRAFT,
      );
    });
  });

  describe('getMembershipRequest', () => {
    it('should return membership request for user', async () => {
      const execMock = jest.fn().mockResolvedValue(mockMembershipRequest);
      mockMembershipRequestModel.findOne.mockReturnValue({ exec: execMock });

      const result = await service.getMembershipRequest(
        '507f1f77bcf86cd799439011',
      );

      expect(result).toEqual(mockMembershipRequest);
      expect(mockMembershipRequestModel.findOne).toHaveBeenCalledWith({
        userId: '507f1f77bcf86cd799439011',
      });
    });
  });

  describe('updateMembershipStatus', () => {
    it('should throw NotFoundException if request not found', async () => {
      mockMembershipRequestModel.findById.mockResolvedValue(null);

      await expect(
        service.updateMembershipStatus(
          'nonexistent',
          { status: MembershipStatus.INFORMATION_VERIFIED },
          'admin123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const request = {
        ...mockMembershipRequest,
        status: MembershipStatus.APPROVED,
        save: jest.fn(),
      };
      mockMembershipRequestModel.findById.mockResolvedValue(request);
      mockUsersService.findById.mockResolvedValue(mockCompleteUser);

      await expect(
        service.updateMembershipStatus(
          '507f1f77bcf86cd799439013',
          { status: MembershipStatus.DRAFT },
          'admin123',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update status and send email', async () => {
      const request = {
        ...mockMembershipRequest,
        status: MembershipStatus.DRAFT,
        statusHistory: [],
        save: jest.fn().mockResolvedValue(mockMembershipRequest),
      };
      mockMembershipRequestModel.findById.mockResolvedValue(request);
      mockUsersService.findById.mockResolvedValue(mockCompleteUser);

      const result = await service.updateMembershipStatus(
        '507f1f77bcf86cd799439013',
        { status: MembershipStatus.INFORMATION_VERIFIED },
        'admin123',
      );

      expect(request.save).toHaveBeenCalled();
      expect(mockMailService.sendMembershipStatusEmail).toHaveBeenCalledWith(
        mockCompleteUser.email,
        mockCompleteUser.firstName,
        MembershipStatus.INFORMATION_VERIFIED,
        undefined,
        undefined,
      );
    });

    it('should generate payment URL when status is PAYMENT_REQUIRED', async () => {
      const request = {
        ...mockMembershipRequest,
        status: MembershipStatus.INFORMATION_VERIFIED,
        statusHistory: [],
        save: jest.fn().mockResolvedValue(mockMembershipRequest),
      };
      mockMembershipRequestModel.findById.mockResolvedValue(request);
      mockUsersService.findById.mockResolvedValue(mockCompleteUser);

      await service.updateMembershipStatus(
        '507f1f77bcf86cd799439013',
        {
          status: MembershipStatus.PAYMENT_REQUIRED,
          paymentAmount: 1000,
        },
        'admin123',
      );

      expect(mockPaymentService.getGateway).toHaveBeenCalled();
      expect(request.paymentUrl).toBe('https://payment.example.com/pay');
      expect(request.paymentTransactionId).toBe('TXN123');
    });

    it('should call approveMembership when status is APPROVED', async () => {
      const request = {
        ...mockMembershipRequest,
        status: MembershipStatus.INFORMATION_VERIFIED,
        statusHistory: [],
        save: jest.fn().mockResolvedValue(mockMembershipRequest),
      };
      mockMembershipRequestModel.findById.mockResolvedValue(request);
      mockUsersService.findById.mockResolvedValue(mockCompleteUser);
      mockUsersService.approveMembership.mockResolvedValue({
        ...mockCompleteUser,
        roles: ['guest', 'member'],
        membershipId: 'M00001',
      });

      await service.updateMembershipStatus(
        '507f1f77bcf86cd799439013',
        { status: MembershipStatus.APPROVED },
        'admin123',
      );

      expect(mockUsersService.approveMembership).toHaveBeenCalledWith(
        request.userId.toString(),
      );
    });
  });

  describe('updatePaymentStatus', () => {
    it('should throw NotFoundException if request not found', async () => {
      mockMembershipRequestModel.findById.mockResolvedValue(null);

      await expect(
        service.updatePaymentStatus('nonexistent', 'TXN123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payment verification fails', async () => {
      mockMembershipRequestModel.findById.mockResolvedValue(
        mockMembershipRequest,
      );
      mockPaymentService.getGateway.mockReturnValue({
        verifyPayment: jest.fn().mockResolvedValue({
          success: false,
        }),
      });

      await expect(
        service.updatePaymentStatus('507f1f77bcf86cd799439013', 'TXN123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update payment status on successful verification', async () => {
      const request = {
        ...mockMembershipRequest,
        paymentAmount: 1000,
        save: jest.fn().mockResolvedValue(mockMembershipRequest),
      };
      mockMembershipRequestModel.findById.mockResolvedValue(request);
      mockUsersService.findById.mockResolvedValue(mockCompleteUser);

      // Reset the mock to return successful verification
      mockPaymentService.getGateway.mockReturnValue({
        verifyPayment: jest.fn().mockResolvedValue({
          success: true,
          transactionId: 'TXN123',
          amount: 1000,
          status: 'VALID',
        }),
      });

      const result = await service.updatePaymentStatus(
        '507f1f77bcf86cd799439013',
        'TXN123',
      );

      expect(request.paymentStatus).toBe('VALID');
      expect(request.paymentTransactionId).toBe('TXN123');
      expect(request.save).toHaveBeenCalled();
      expect(mockFinancialTransactionService.createIncomeTransaction).toHaveBeenCalledWith({
        amount: 1000,
        description: `Membership fee payment - ${mockCompleteUser.firstName} ${mockCompleteUser.lastName}`,
        category: 'Membership Fee',
        referenceNumber: 'TXN123',
        transactionDate: expect.any(Date),
        createdBy: request.userId.toString(),
        payer: `${mockCompleteUser.firstName} ${mockCompleteUser.lastName}`,
      });
    });
  });

  describe('getAllMembershipRequests', () => {
    it('should return all requests when no status filter', async () => {
      const execMock = jest.fn().mockResolvedValue([mockMembershipRequest]);
      const sortMock = jest.fn().mockReturnValue({ exec: execMock });
      mockMembershipRequestModel.find.mockReturnValue({ sort: sortMock });

      const result = await service.getAllMembershipRequests();

      expect(result).toEqual([mockMembershipRequest]);
      expect(mockMembershipRequestModel.find).toHaveBeenCalledWith({});
    });

    it('should return filtered requests when status provided', async () => {
      const execMock = jest.fn().mockResolvedValue([mockMembershipRequest]);
      const sortMock = jest.fn().mockReturnValue({ exec: execMock });
      mockMembershipRequestModel.find.mockReturnValue({ sort: sortMock });

      await service.getAllMembershipRequests(MembershipStatus.DRAFT);

      expect(mockMembershipRequestModel.find).toHaveBeenCalledWith({
        status: MembershipStatus.DRAFT,
      });
    });
  });
});
