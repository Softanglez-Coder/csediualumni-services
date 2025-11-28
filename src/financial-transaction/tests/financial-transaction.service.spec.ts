import { Test, TestingModule } from '@nestjs/testing';
import { FinancialTransactionService } from '../financial-transaction.service';
import { getModelToken } from '@nestjs/mongoose';
import { FinancialTransaction } from '../schemas/financial-transaction.schema';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';

describe('FinancialTransactionService', () => {
  let service: FinancialTransactionService;

  const mockUserId = new Types.ObjectId().toString();
  const mockReviewerId = new Types.ObjectId().toString();
  const mockTransactionId = new Types.ObjectId().toString();

  const mockTransaction = {
    _id: mockTransactionId,
    type: TransactionType.EXPENSE,
    amount: 1000,
    description: 'Office supplies',
    currency: 'BDT',
    transactionDate: new Date(),
    status: TransactionStatus.PENDING_REVIEW,
    createdBy: new Types.ObjectId(mockUserId),
    statusHistory: [],
    save: jest.fn(),
  };

  const mockTransactionModel = jest.fn().mockImplementation((dto) => ({
    ...dto,
    _id: mockTransactionId,
    save: jest.fn().mockResolvedValue({
      ...dto,
      _id: mockTransactionId,
    }),
  }));

  mockTransactionModel.findById = jest.fn();
  mockTransactionModel.find = jest.fn();
  mockTransactionModel.findByIdAndDelete = jest.fn();
  mockTransactionModel.aggregate = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialTransactionService,
        {
          provide: getModelToken(FinancialTransaction.name),
          useValue: mockTransactionModel,
        },
      ],
    }).compile();

    service = module.get<FinancialTransactionService>(
      FinancialTransactionService,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTransaction', () => {
    it('should throw ForbiddenException for non-admin creating income transaction', async () => {
      const createDto = {
        type: TransactionType.INCOME,
        amount: 5000,
        description: 'Membership fee',
        transactionDate: new Date().toISOString(),
      };

      await expect(
        service.createTransaction(createDto, mockUserId, [UserRole.MEMBER]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for non-admin/accountant creating expense transaction', async () => {
      const createDto = {
        type: TransactionType.EXPENSE,
        amount: 1000,
        description: 'Office supplies',
        transactionDate: new Date().toISOString(),
      };

      await expect(
        service.createTransaction(createDto, mockUserId, [UserRole.MEMBER]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create income transaction with APPROVED status for admin', async () => {
      const createDto = {
        type: TransactionType.INCOME,
        amount: 5000,
        description: 'Membership fee',
        transactionDate: new Date().toISOString(),
      };

      const result = await service.createTransaction(createDto, mockUserId, [
        UserRole.ADMIN,
      ]);

      expect(result).toBeDefined();
      expect(result.status).toBe(TransactionStatus.APPROVED);
    });

    it('should create expense transaction with PENDING_REVIEW status for accountant', async () => {
      const createDto = {
        type: TransactionType.EXPENSE,
        amount: 1000,
        description: 'Office supplies',
        transactionDate: new Date().toISOString(),
      };

      const result = await service.createTransaction(createDto, mockUserId, [
        UserRole.ACCOUNTANT,
      ]);

      expect(result).toBeDefined();
      expect(result.status).toBe(TransactionStatus.PENDING_REVIEW);
    });
  });

  describe('updateTransaction', () => {
    it('should throw NotFoundException if transaction not found', async () => {
      mockTransactionModel.findById.mockResolvedValue(null);

      await expect(
        service.updateTransaction(
          'nonexistent',
          { amount: 2000 },
          mockUserId,
          [UserRole.ADMIN],
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if non-admin non-creator tries to update', async () => {
      const differentUserId = new Types.ObjectId().toString();
      mockTransactionModel.findById.mockResolvedValue({
        ...mockTransaction,
        createdBy: new Types.ObjectId(mockUserId),
      });

      await expect(
        service.updateTransaction(
          mockTransactionId,
          { amount: 2000 },
          differentUserId,
          [UserRole.ACCOUNTANT],
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if non-admin tries to update approved transaction', async () => {
      mockTransactionModel.findById.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.APPROVED,
        createdBy: new Types.ObjectId(mockUserId),
      });

      await expect(
        service.updateTransaction(
          mockTransactionId,
          { amount: 2000 },
          mockUserId,
          [UserRole.ACCOUNTANT],
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update transaction successfully for creator', async () => {
      const transaction = {
        ...mockTransaction,
        createdBy: new Types.ObjectId(mockUserId),
        save: jest.fn().mockResolvedValue({ ...mockTransaction, amount: 2000 }),
      };
      mockTransactionModel.findById.mockResolvedValue(transaction);

      const result = await service.updateTransaction(
        mockTransactionId,
        { amount: 2000 },
        mockUserId,
        [UserRole.ACCOUNTANT],
      );

      expect(transaction.save).toHaveBeenCalled();
      expect(transaction.amount).toBe(2000);
    });
  });

  describe('reviewTransaction', () => {
    it('should throw NotFoundException if transaction not found', async () => {
      mockTransactionModel.findById.mockResolvedValue(null);

      await expect(
        service.reviewTransaction(
          'nonexistent',
          { status: TransactionStatus.APPROVED },
          mockReviewerId,
          [UserRole.ADMIN],
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if non-admin/accountant tries to review', async () => {
      mockTransactionModel.findById.mockResolvedValue(mockTransaction);

      await expect(
        service.reviewTransaction(
          mockTransactionId,
          { status: TransactionStatus.APPROVED },
          mockReviewerId,
          [UserRole.MEMBER],
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if accountant tries to review income transaction', async () => {
      mockTransactionModel.findById.mockResolvedValue({
        ...mockTransaction,
        type: TransactionType.INCOME,
      });

      await expect(
        service.reviewTransaction(
          mockTransactionId,
          { status: TransactionStatus.APPROVED },
          mockReviewerId,
          [UserRole.ACCOUNTANT],
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      mockTransactionModel.findById.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.APPROVED,
      });

      await expect(
        service.reviewTransaction(
          mockTransactionId,
          { status: TransactionStatus.PENDING_REVIEW },
          mockReviewerId,
          [UserRole.ADMIN],
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if rejecting without reason', async () => {
      mockTransactionModel.findById.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.PENDING_REVIEW,
        statusHistory: [],
      });

      await expect(
        service.reviewTransaction(
          mockTransactionId,
          { status: TransactionStatus.REJECTED },
          mockReviewerId,
          [UserRole.ADMIN],
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should approve transaction successfully', async () => {
      const transaction = {
        ...mockTransaction,
        status: TransactionStatus.PENDING_REVIEW,
        statusHistory: [],
        save: jest.fn().mockResolvedValue({
          ...mockTransaction,
          status: TransactionStatus.APPROVED,
        }),
      };
      mockTransactionModel.findById.mockResolvedValue(transaction);

      await service.reviewTransaction(
        mockTransactionId,
        { status: TransactionStatus.APPROVED, reviewNote: 'Looks good' },
        mockReviewerId,
        [UserRole.ADMIN],
      );

      expect(transaction.status).toBe(TransactionStatus.APPROVED);
      expect(transaction.reviewedBy.toString()).toBe(mockReviewerId);
      expect(transaction.save).toHaveBeenCalled();
    });

    it('should reject transaction with reason', async () => {
      const transaction = {
        ...mockTransaction,
        status: TransactionStatus.PENDING_REVIEW,
        statusHistory: [],
        save: jest.fn().mockResolvedValue({
          ...mockTransaction,
          status: TransactionStatus.REJECTED,
        }),
      };
      mockTransactionModel.findById.mockResolvedValue(transaction);

      await service.reviewTransaction(
        mockTransactionId,
        {
          status: TransactionStatus.REJECTED,
          rejectionReason: 'Missing receipts',
        },
        mockReviewerId,
        [UserRole.ADMIN],
      );

      expect(transaction.status).toBe(TransactionStatus.REJECTED);
      expect(transaction.rejectionReason).toBe('Missing receipts');
      expect(transaction.save).toHaveBeenCalled();
    });
  });

  describe('getTransactionById', () => {
    it('should throw NotFoundException if transaction not found', async () => {
      const execMock = jest.fn().mockResolvedValue(null);
      const populateMock2 = jest.fn().mockReturnValue({ exec: execMock });
      const populateMock1 = jest
        .fn()
        .mockReturnValue({ populate: populateMock2 });
      mockTransactionModel.findById.mockReturnValue({
        populate: populateMock1,
      });

      await expect(service.getTransactionById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return transaction with populated fields', async () => {
      const execMock = jest.fn().mockResolvedValue(mockTransaction);
      const populateMock2 = jest.fn().mockReturnValue({ exec: execMock });
      const populateMock1 = jest
        .fn()
        .mockReturnValue({ populate: populateMock2 });
      mockTransactionModel.findById.mockReturnValue({
        populate: populateMock1,
      });

      const result = await service.getTransactionById(mockTransactionId);

      expect(result).toEqual(mockTransaction);
    });
  });

  describe('deleteTransaction', () => {
    it('should throw NotFoundException if transaction not found', async () => {
      mockTransactionModel.findById.mockResolvedValue(null);

      await expect(
        service.deleteTransaction('nonexistent', mockUserId, [UserRole.ADMIN]),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if non-admin non-creator tries to delete', async () => {
      const differentUserId = new Types.ObjectId().toString();
      mockTransactionModel.findById.mockResolvedValue({
        ...mockTransaction,
        createdBy: new Types.ObjectId(mockUserId),
      });

      await expect(
        service.deleteTransaction(mockTransactionId, differentUserId, [
          UserRole.ACCOUNTANT,
        ]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if creator tries to delete approved transaction', async () => {
      mockTransactionModel.findById.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.APPROVED,
        createdBy: new Types.ObjectId(mockUserId),
      });

      await expect(
        service.deleteTransaction(mockTransactionId, mockUserId, [
          UserRole.ACCOUNTANT,
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should delete draft transaction successfully for creator', async () => {
      mockTransactionModel.findById.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.DRAFT,
        createdBy: new Types.ObjectId(mockUserId),
      });

      await service.deleteTransaction(mockTransactionId, mockUserId, [
        UserRole.ACCOUNTANT,
      ]);

      expect(mockTransactionModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockTransactionId,
      );
    });

    it('should delete any transaction for admin', async () => {
      mockTransactionModel.findById.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.APPROVED,
        createdBy: new Types.ObjectId(mockUserId),
      });

      await service.deleteTransaction(mockTransactionId, mockReviewerId, [
        UserRole.ADMIN,
      ]);

      expect(mockTransactionModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockTransactionId,
      );
    });
  });

  describe('getFinancialSummary', () => {
    it('should return financial summary with correct values', async () => {
      mockTransactionModel.aggregate
        .mockResolvedValueOnce([{ _id: null, total: 50000, count: 10 }])
        .mockResolvedValueOnce([{ _id: null, total: 30000, count: 5 }])
        .mockResolvedValueOnce([{ _id: null, total: 5000, count: 2 }]);

      const result = await service.getFinancialSummary();

      expect(result).toEqual({
        totalIncome: 50000,
        totalExpense: 30000,
        netBalance: 20000,
        incomeCount: 10,
        expenseCount: 5,
        pendingExpenseCount: 2,
        pendingExpenseAmount: 5000,
      });
    });

    it('should return zeros when no transactions', async () => {
      mockTransactionModel.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getFinancialSummary();

      expect(result).toEqual({
        totalIncome: 0,
        totalExpense: 0,
        netBalance: 0,
        incomeCount: 0,
        expenseCount: 0,
        pendingExpenseCount: 0,
        pendingExpenseAmount: 0,
      });
    });
  });

  describe('getPendingReviewTransactions', () => {
    it('should throw ForbiddenException for non-admin/accountant', async () => {
      await expect(
        service.getPendingReviewTransactions([UserRole.MEMBER]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return pending expense transactions for accountant', async () => {
      const execMock = jest.fn().mockResolvedValue([mockTransaction]);
      const sortMock = jest.fn().mockReturnValue({ exec: execMock });
      const populateMock = jest.fn().mockReturnValue({ sort: sortMock });
      mockTransactionModel.find.mockReturnValue({ populate: populateMock });

      const result = await service.getPendingReviewTransactions([
        UserRole.ACCOUNTANT,
      ]);

      expect(mockTransactionModel.find).toHaveBeenCalledWith({
        status: TransactionStatus.PENDING_REVIEW,
        type: TransactionType.EXPENSE,
      });
      expect(result).toEqual([mockTransaction]);
    });

    it('should return all pending transactions for admin', async () => {
      const execMock = jest.fn().mockResolvedValue([mockTransaction]);
      const sortMock = jest.fn().mockReturnValue({ exec: execMock });
      const populateMock = jest.fn().mockReturnValue({ sort: sortMock });
      mockTransactionModel.find.mockReturnValue({ populate: populateMock });

      const result = await service.getPendingReviewTransactions([
        UserRole.ADMIN,
      ]);

      expect(mockTransactionModel.find).toHaveBeenCalledWith({
        status: TransactionStatus.PENDING_REVIEW,
      });
      expect(result).toEqual([mockTransaction]);
    });
  });
});
