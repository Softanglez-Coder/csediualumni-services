import { Controller, Get, UseGuards } from '@nestjs/common';
import { Auth0Guard } from './guards/auth0.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

@Controller('auth')
@UseGuards(Auth0Guard)
export class AuthController {
  @Public()
  @Get('health')
  healthCheck() {
    return { status: 'ok', message: 'Auth service is running' };
  }

  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return {
      message: 'Authenticated user profile',
      user,
    };
  }

  @Get('me')
  getCurrentUser(@CurrentUser() user: any) {
    return user;
  }
}
