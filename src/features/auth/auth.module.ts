import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { Auth0Strategy } from './strategies/auth0.strategy';
import { Auth0Guard } from './guards/auth0.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'auth0' }),
    ConfigModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [Auth0Strategy, Auth0Guard],
  exports: [Auth0Guard],
})
export class AuthModule {}
