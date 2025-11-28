import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FinancialTransactionController } from './financial-transaction.controller';
import { FinancialTransactionService } from './financial-transaction.service';
import {
  FinancialTransaction,
  FinancialTransactionSchema,
} from './schemas/financial-transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FinancialTransaction.name, schema: FinancialTransactionSchema },
    ]),
  ],
  controllers: [FinancialTransactionController],
  providers: [FinancialTransactionService],
  exports: [FinancialTransactionService],
})
export class FinancialTransactionModule {}
