import {
  Injectable,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class Auth0Guard extends AuthGuard('auth0') {
  private readonly logger = new Logger(Auth0Guard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    this.logger.debug(`Auth check for ${request.method} ${request.url}`);
    this.logger.debug(`Is public route: ${isPublic}`);

    if (isPublic) {
      this.logger.debug('Route is public, allowing access');
      return true;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      this.logger.warn('No Authorization header found');
    } else {
      this.logger.debug(
        `Authorization header present: ${authHeader.substring(0, 20)}...`,
      );
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (err) {
      this.logger.error(`Auth error for ${request.url}: ${err.message}`);
      throw err;
    }

    if (!user) {
      this.logger.warn(`Authentication failed for ${request.url}`);
      if (info) {
        this.logger.warn(`Auth info: ${JSON.stringify(info)}`);
      }
      throw new UnauthorizedException('Authentication failed');
    }

    this.logger.debug(`User authenticated: ${user.email} (${user.userId})`);
    return user;
  }
}
