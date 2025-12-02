import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { Auth0Guard } from './guards/auth0.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { UsersService } from '../users/users.service';

@Controller('auth')
@UseGuards(Auth0Guard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get('health')
  healthCheck() {
    this.logger.debug('Health check called');
    return { status: 'ok', message: 'Auth service is running' };
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    this.logger.log(`Getting profile for user: ${user.email}`);

    try {
      // Create/update user in database on each login
      const dbUser = await this.usersService.findOrCreate(user);
      this.logger.debug(`User ${user.email} synced to database`);

      return {
        message: 'Authenticated user profile',
        user: {
          ...user,
          dbUser,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error getting profile for ${user.email}: ${error.message}`,
      );
      throw error;
    }
  }

  @Get('me')
  async getCurrentUser(@CurrentUser() user: any) {
    this.logger.log(`Getting current user: ${user.email}`);

    try {
      // Create/update user in database on each login
      const dbUser = await this.usersService.findOrCreate(user);
      this.logger.debug(`User ${user.email} found/created in database`);
      return dbUser;
    } catch (error) {
      this.logger.error(
        `Error getting current user ${user.email}: ${error.message}`,
      );
      throw error;
    }
  }
}
