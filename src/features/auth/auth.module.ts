import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { Auth0Strategy } from './strategies/auth0.strategy';
import { Auth0Guard } from './guards/auth0.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'auth0' }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [Auth0Strategy, Auth0Guard],
  exports: [Auth0Guard],
})
export class AuthModule {}
