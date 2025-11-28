import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  FinancialTransaction,
  FinancialTransactionDocument,
} from './schemas/financial-transaction.schema';
import { TransactionType } from './enums/transaction-type.enum';
import { TransactionStatus } from './enums/transaction-status.enum';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  ReviewTransactionDto,
  TransactionFilterDto,
} from './dto/financial-transaction.dto';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class FinancialTransactionService {
  constructor(
    @InjectModel(FinancialTransaction.name)
    private transactionModel: Model<FinancialTransactionDocument>,
  ) {}

  async createTransaction(
    createDto: CreateTransactionDto,
    userId: string,
    userRoles: UserRole[],
  ): Promise<FinancialTransactionDocument> {
    const isAdmin =
      userRoles.includes(UserRole.ADMIN) ||
      userRoles.includes(UserRole.SYSTEM_ADMIN);
    const isAccountant = userRoles.includes(UserRole.ACCOUNTANT);

    // For income transactions, only admin can create
    if (createDto.type === TransactionType.INCOME && !isAdmin) {
      throw new ForbiddenException(
        'Only admins can create income transactions',
      );
    }

    // For expense transactions, any authenticated user with accountant or admin role can create
    if (
      createDto.type === TransactionType.EXPENSE &&
      !isAdmin &&
      !isAccountant
    ) {
      throw new ForbiddenException(
        'Only admins or accountants can create expense transactions',
      );
    }

    // Determine initial status based on transaction type and user role
    let initialStatus = TransactionStatus.DRAFT;
    if (createDto.type === TransactionType.INCOME && isAdmin) {
      // Admin-created income can be directly approved
      initialStatus = TransactionStatus.APPROVED;
    } else if (createDto.type === TransactionType.EXPENSE) {
      // Expenses start as pending review
      initialStatus = TransactionStatus.PENDING_REVIEW;
    }

    const transaction = new this.transactionModel({
      ...createDto,
      transactionDate: new Date(createDto.transactionDate),
      status: initialStatus,
      createdBy: new Types.ObjectId(userId),
      statusHistory: [
        {
          status: initialStatus,
          changedAt: new Date(),
          changedBy: userId,
          note: 'Transaction created',
        },
      ],
    });

    return transaction.save();
  }

  async updateTransaction(
    transactionId: string,
    updateDto: UpdateTransactionDto,
    userId: string,
    userRoles: UserRole[],
  ): Promise<FinancialTransactionDocument> {
    const transaction = await this.transactionModel.findById(transactionId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const isAdmin =
      userRoles.includes(UserRole.ADMIN) ||
      userRoles.includes(UserRole.SYSTEM_ADMIN);
    const isCreator = transaction.createdBy.toString() === userId;

    // Only admin or creator can update
    if (!isAdmin && !isCreator) {
      throw new ForbiddenException(
        'You do not have permission to update this transaction',
      );
    }

    // Cannot update approved or rejected transactions (except by admin)
    if (
      !isAdmin &&
      (transaction.status === TransactionStatus.APPROVED ||
        transaction.status === TransactionStatus.REJECTED)
    ) {
      throw new BadRequestException(
        'Cannot update approved or rejected transactions',
      );
    }

    // Update fields
    if (updateDto.amount !== undefined) transaction.amount = updateDto.amount;
    if (updateDto.description !== undefined)
      transaction.description = updateDto.description;
    if (updateDto.category !== undefined)
      transaction.category = updateDto.category;
    if (updateDto.referenceNumber !== undefined)
      transaction.referenceNumber = updateDto.referenceNumber;
    if (updateDto.transactionDate !== undefined)
      transaction.transactionDate = new Date(updateDto.transactionDate);
    if (updateDto.attachmentUrl !== undefined)
      transaction.attachmentUrl = updateDto.attachmentUrl;
    if (updateDto.payee !== undefined) transaction.payee = updateDto.payee;
    if (updateDto.payer !== undefined) transaction.payer = updateDto.payer;

    return transaction.save();
  }

  async reviewTransaction(
    transactionId: string,
    reviewDto: ReviewTransactionDto,
    reviewerId: string,
    userRoles: UserRole[],
  ): Promise<FinancialTransactionDocument> {
    const transaction = await this.transactionModel.findById(transactionId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const isAdmin =
      userRoles.includes(UserRole.ADMIN) ||
      userRoles.includes(UserRole.SYSTEM_ADMIN);
    const isAccountant = userRoles.includes(UserRole.ACCOUNTANT);

    // Only admin or accountant can review
    if (!isAdmin && !isAccountant) {
      throw new ForbiddenException(
        'Only admins or accountants can review transactions',
      );
    }

    // For expense transactions, accountants can review. For income, only admin
    if (transaction.type === TransactionType.INCOME && !isAdmin) {
      throw new ForbiddenException(
        'Only admins can review income transactions',
      );
    }

    // Validate status transition
    this.validateStatusTransition(transaction.status, reviewDto.status);

    // Handle rejection
    if (
      reviewDto.status === TransactionStatus.REJECTED &&
      !reviewDto.rejectionReason
    ) {
      throw new BadRequestException(
        'Rejection reason is required when rejecting a transaction',
      );
    }

    transaction.status = reviewDto.status;
    transaction.reviewedBy = new Types.ObjectId(reviewerId);
    transaction.reviewedAt = new Date();

    if (reviewDto.reviewNote) {
      transaction.reviewNote = reviewDto.reviewNote;
    }

    if (reviewDto.rejectionReason) {
      transaction.rejectionReason = reviewDto.rejectionReason;
    }

    // Add to status history
    transaction.statusHistory.push({
      status: reviewDto.status,
      changedAt: new Date(),
      changedBy: reviewerId,
      note: reviewDto.reviewNote || reviewDto.rejectionReason,
    });

    return transaction.save();
  }

  private validateStatusTransition(
    currentStatus: TransactionStatus,
    newStatus: TransactionStatus,
  ): void {
    // Define valid transitions
    const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
      [TransactionStatus.DRAFT]: [
        TransactionStatus.PENDING_REVIEW,
        TransactionStatus.APPROVED,
        TransactionStatus.REJECTED,
      ],
      [TransactionStatus.PENDING_REVIEW]: [
        TransactionStatus.APPROVED,
        TransactionStatus.REJECTED,
      ],
      [TransactionStatus.APPROVED]: [],
      [TransactionStatus.REJECTED]: [TransactionStatus.PENDING_REVIEW],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  async getTransactionById(
    transactionId: string,
  ): Promise<FinancialTransactionDocument> {
    const transaction = await this.transactionModel
      .findById(transactionId)
      .populate('createdBy', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email')
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async getTransactions(
    filter: TransactionFilterDto,
    userRoles: UserRole[],
    userId?: string,
  ): Promise<FinancialTransactionDocument[]> {
    const isAdmin =
      userRoles.includes(UserRole.ADMIN) ||
      userRoles.includes(UserRole.SYSTEM_ADMIN);
    const isAccountant = userRoles.includes(UserRole.ACCOUNTANT);

    const query: Record<string, unknown> = {};

    // Apply filters
    if (filter.type) {
      query.type = filter.type;
    }

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.category) {
      query.category = filter.category;
    }

    if (filter.startDate || filter.endDate) {
      query.transactionDate = {};
      if (filter.startDate) {
        (query.transactionDate as Record<string, Date>).$gte = new Date(
          filter.startDate,
        );
      }
      if (filter.endDate) {
        (query.transactionDate as Record<string, Date>).$lte = new Date(
          filter.endDate,
        );
      }
    }

    // Non-admin/accountant users can only see their own transactions
    if (!isAdmin && !isAccountant && userId) {
      query.createdBy = new Types.ObjectId(userId);
    }

    return this.transactionModel
      .find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ transactionDate: -1 })
      .exec();
  }

  async getMyTransactions(
    userId: string,
    filter: TransactionFilterDto,
  ): Promise<FinancialTransactionDocument[]> {
    const query: Record<string, unknown> = {
      createdBy: new Types.ObjectId(userId),
    };

    if (filter.type) {
      query.type = filter.type;
    }

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.startDate || filter.endDate) {
      query.transactionDate = {};
      if (filter.startDate) {
        (query.transactionDate as Record<string, Date>).$gte = new Date(
          filter.startDate,
        );
      }
      if (filter.endDate) {
        (query.transactionDate as Record<string, Date>).$lte = new Date(
          filter.endDate,
        );
      }
    }

    return this.transactionModel
      .find(query)
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ transactionDate: -1 })
      .exec();
  }

  async getPendingReviewTransactions(
    userRoles: UserRole[],
  ): Promise<FinancialTransactionDocument[]> {
    const isAdmin =
      userRoles.includes(UserRole.ADMIN) ||
      userRoles.includes(UserRole.SYSTEM_ADMIN);
    const isAccountant = userRoles.includes(UserRole.ACCOUNTANT);

    if (!isAdmin && !isAccountant) {
      throw new ForbiddenException(
        'Only admins or accountants can view pending transactions',
      );
    }

    const query: Record<string, unknown> = {
      status: TransactionStatus.PENDING_REVIEW,
    };

    // Accountants can only see expense transactions pending review
    if (!isAdmin && isAccountant) {
      query.type = TransactionType.EXPENSE;
    }

    return this.transactionModel
      .find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getFinancialSummary(
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    incomeCount: number;
    expenseCount: number;
    pendingExpenseCount: number;
    pendingExpenseAmount: number;
  }> {
    const dateQuery: Record<string, unknown> = {};
    if (startDate || endDate) {
      if (startDate) {
        dateQuery.$gte = new Date(startDate);
      }
      if (endDate) {
        dateQuery.$lte = new Date(endDate);
      }
    }

    const baseMatch: Record<string, unknown> = {
      status: TransactionStatus.APPROVED,
    };
    if (Object.keys(dateQuery).length > 0) {
      baseMatch.transactionDate = dateQuery;
    }

    interface AggregationResult {
      _id: null;
      total: number;
      count: number;
    }

    const [incomeResult, expenseResult, pendingExpenseResult] =
      await Promise.all([
        this.transactionModel.aggregate<AggregationResult>([
          {
            $match: {
              ...baseMatch,
              type: TransactionType.INCOME,
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
        ]),
        this.transactionModel.aggregate<AggregationResult>([
          {
            $match: {
              ...baseMatch,
              type: TransactionType.EXPENSE,
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
        ]),
        this.transactionModel.aggregate<AggregationResult>([
          {
            $match: {
              status: TransactionStatus.PENDING_REVIEW,
              type: TransactionType.EXPENSE,
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    const totalIncome: number = incomeResult[0]?.total ?? 0;
    const incomeCount: number = incomeResult[0]?.count ?? 0;
    const totalExpense: number = expenseResult[0]?.total ?? 0;
    const expenseCount: number = expenseResult[0]?.count ?? 0;
    const pendingExpenseAmount: number = pendingExpenseResult[0]?.total ?? 0;
    const pendingExpenseCount: number = pendingExpenseResult[0]?.count ?? 0;

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      incomeCount,
      expenseCount,
      pendingExpenseCount,
      pendingExpenseAmount,
    };
  }

  async deleteTransaction(
    transactionId: string,
    userId: string,
    userRoles: UserRole[],
  ): Promise<void> {
    const transaction = await this.transactionModel.findById(transactionId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const isAdmin =
      userRoles.includes(UserRole.ADMIN) ||
      userRoles.includes(UserRole.SYSTEM_ADMIN);
    const isCreator = transaction.createdBy.toString() === userId;

    // Only admin can delete any transaction
    // Creator can delete only if status is DRAFT or REJECTED
    if (!isAdmin) {
      if (!isCreator) {
        throw new ForbiddenException(
          'You do not have permission to delete this transaction',
        );
      }
      if (
        transaction.status !== TransactionStatus.DRAFT &&
        transaction.status !== TransactionStatus.REJECTED
      ) {
        throw new BadRequestException(
          'Only draft or rejected transactions can be deleted',
        );
      }
    }

    await this.transactionModel.findByIdAndDelete(transactionId);
  }
}
