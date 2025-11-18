import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  private templates: Map<string, string> = new Map();

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    const templatesDir = path.join(__dirname, 'templates');
    const templateFiles = [
      'email-verification.html',
      'password-reset.html',
      'welcome.html',
      'membership-draft.html',
      'membership-information-verified.html',
      'membership-payment-required.html',
      'membership-approved.html',
      'membership-rejected.html',
    ];

    templateFiles.forEach((file) => {
      const templatePath = path.join(templatesDir, file);
      try {
        const content = fs.readFileSync(templatePath, 'utf-8');
        this.templates.set(file, content);
      } catch (error) {
        console.error(`Failed to load template ${file}:`, error);
      }
    });
  }

  private replaceVariables(
    template: string,
    variables: Record<string, string>,
  ): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  }

  async sendVerificationEmail(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('frontend.url');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const template = this.templates.get('email-verification.html');
    if (!template) {
      throw new Error('Email verification template not found');
    }

    const html = this.replaceVariables(template, {
      firstName,
      verificationUrl,
    });

    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify Your Email - CSE DIU Alumni',
      html,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('frontend.url');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const template = this.templates.get('password-reset.html');
    if (!template) {
      throw new Error('Password reset template not found');
    }

    const html = this.replaceVariables(template, {
      firstName,
      resetUrl,
    });

    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset Request - CSE DIU Alumni',
      html,
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const template = this.templates.get('welcome.html');
    if (!template) {
      throw new Error('Welcome email template not found');
    }

    const html = this.replaceVariables(template, {
      firstName,
    });

    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to CSE DIU Alumni!',
      html,
    });
  }

  async sendMembershipStatusEmail(
    email: string,
    firstName: string,
    status: string,
    rejectionReason?: string,
    paymentUrl?: string,
  ): Promise<void> {
    const templateMap: Record<string, string> = {
      draft: 'membership-draft.html',
      information_verified: 'membership-information-verified.html',
      payment_required: 'membership-payment-required.html',
      approved: 'membership-approved.html',
      rejected: 'membership-rejected.html',
    };

    const subjectMap: Record<string, string> = {
      draft: 'Membership Request Received - CSE DIU Alumni',
      information_verified: 'Information Verified - CSE DIU Alumni',
      payment_required: 'Payment Required - CSE DIU Alumni',
      approved: 'Membership Approved - Welcome! 🎉',
      rejected: 'Membership Request Update - CSE DIU Alumni',
    };

    const templateFile = templateMap[status];
    if (!templateFile) {
      console.error(`No template found for status: ${status}`);
      return;
    }

    const template = this.templates.get(templateFile);
    if (!template) {
      console.error(`Template ${templateFile} not found`);
      return;
    }

    const variables: Record<string, string> = {
      firstName,
      rejectionReason: rejectionReason || '',
      paymentUrl: paymentUrl || '',
    };

    const html = this.replaceVariables(template, variables);

    await this.mailerService.sendMail({
      to: email,
      subject: subjectMap[status],
      html,
    });
  }
}
