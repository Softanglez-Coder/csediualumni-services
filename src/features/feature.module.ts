import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MembershipModule } from './membership/membership.module';
import { PaymentModule } from './payment/payment.module';
import { NotificationModule } from './notification/notification.module';
import { ContactModule } from './contact/contact.module';
import { SalesModule } from './sales/sales.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { WebsiteModule } from './website/website.module';
import { CourseModule } from './course/course.module';
import { JobModule } from './job/job.module';
import { IssueModule } from './issue/issue.module';
import { AppointmentModule } from './appointment/appointment.module';
import { InvoiceModule } from './invoice/invoice.module';
import { AccountingModule } from './accounting/accounting.module';
import { InventoryModule } from './inventory/inventory.module';
import { PurchaseModule } from './purchase/purchase.module';
import { BarcodeModule } from './barcode/barcode.module';
import { DocumentsModule } from './documents/documents.module';
import { EmailModule } from './email/email.module';
import { EventModule } from './event/event.module';
import { ExpensesModule } from './expenses/expenses.module';
import { EmployeesModule } from './employees/employees.module';
import { MealModule } from './meal/meal.module';

@Module({
  imports: [AuthModule, UserModule, MembershipModule, PaymentModule, NotificationModule, ContactModule, SalesModule, SubscriptionModule, WebsiteModule, CourseModule, JobModule, IssueModule, AppointmentModule, InvoiceModule, AccountingModule, InventoryModule, PurchaseModule, BarcodeModule, DocumentsModule, EmailModule, EventModule, ExpensesModule, EmployeesModule, MealModule]
})
export class FeatureModule {}
