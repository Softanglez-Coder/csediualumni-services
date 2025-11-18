import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';

@Injectable()
export class SystemAdminInitService implements OnModuleInit {
  private readonly logger = new Logger(SystemAdminInitService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initializeSystemAdmin();
  }

  private async initializeSystemAdmin() {
    try {
      const email = this.configService.get<string>('systemAdmin.email');
      const password = this.configService.get<string>('systemAdmin.password');
      const firstName =
        this.configService.get<string>('systemAdmin.firstName') || 'System';
      const lastName =
        this.configService.get<string>('systemAdmin.lastName') ||
        'Administrator';

      if (!email || !password) {
        this.logger.warn(
          'System admin credentials not configured. Skipping system admin initialization.',
        );
        return;
      }

      const systemAdmin = await this.usersService.ensureSystemAdminExists(
        email,
        password,
        firstName,
        lastName,
      );

      this.logger.log(
        `System admin bot user initialized: ${systemAdmin.email}`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize system admin bot user', error);
      // Don't throw error to prevent application from failing to start
    }
  }
}
