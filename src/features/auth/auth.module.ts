import { Module } from '@nestjs/common';
import { AuthService } from './services';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthInterceptor } from './interceptors';

@Module({
  providers: [
    AuthService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthInterceptor,
    },
  ],
})
export class AuthModule {}
