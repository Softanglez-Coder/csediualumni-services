import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FinancialTransactionService } from './financial-transaction.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  ReviewTransactionDto,
  TransactionFilterDto,
} from './dto/financial-transaction.dto';
import { UserRole } from '../common/enums/user-role.enum';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    roles: UserRole[];
  };
}

@Controller('api/financial-transactions')
@UseGuards(JwtAuthGuard)
export class FinancialTransactionController {
  constructor(
    private readonly financialTransactionService: FinancialTransactionService,
  ) {}

  @Post()
  async createTransaction(
    @Body() createDto: CreateTransactionDto,
    @Request() req: RequestWithUser,
  ) {
    return this.financialTransactionService.createTransaction(
      createDto,
      req.user.userId,
      req.user.roles,
    );
  }

  @Get()
  async getTransactions(
    @Query() filter: TransactionFilterDto,
    @Request() req: RequestWithUser,
  ) {
    return this.financialTransactionService.getTransactions(
      filter,
      req.user.roles,
      req.user.userId,
    );
  }

  @Get('my-transactions')
  async getMyTransactions(
    @Query() filter: TransactionFilterDto,
    @Request() req: RequestWithUser,
  ) {
    return this.financialTransactionService.getMyTransactions(
      req.user.userId,
      filter,
    );
  }

  @Get('pending-review')
  async getPendingReviewTransactions(@Request() req: RequestWithUser) {
    return this.financialTransactionService.getPendingReviewTransactions(
      req.user.roles,
    );
  }

  @Get('summary')
  async getFinancialSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financialTransactionService.getFinancialSummary(
      startDate,
      endDate,
    );
  }

  @Get(':id')
  async getTransactionById(@Param('id') id: string) {
    return this.financialTransactionService.getTransactionById(id);
  }

  @Patch(':id')
  async updateTransaction(
    @Param('id') id: string,
    @Body() updateDto: UpdateTransactionDto,
    @Request() req: RequestWithUser,
  ) {
    return this.financialTransactionService.updateTransaction(
      id,
      updateDto,
      req.user.userId,
      req.user.roles,
    );
  }

  @Patch(':id/review')
  async reviewTransaction(
    @Param('id') id: string,
    @Body() reviewDto: ReviewTransactionDto,
    @Request() req: RequestWithUser,
  ) {
    return this.financialTransactionService.reviewTransaction(
      id,
      reviewDto,
      req.user.userId,
      req.user.roles,
    );
  }

  @Delete(':id')
  async deleteTransaction(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    await this.financialTransactionService.deleteTransaction(
      id,
      req.user.userId,
      req.user.roles,
    );
    return { message: 'Transaction deleted successfully' };
  }
}
