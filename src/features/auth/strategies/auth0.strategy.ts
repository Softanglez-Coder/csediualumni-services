import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Auth0Strategy extends PassportStrategy(Strategy, 'auth0') {
  private readonly logger = new Logger(Auth0Strategy.name);

  constructor(private configService: ConfigService) {
    const domain = configService.get<string>('AUTH0_DOMAIN');
    const audiences = configService.get<string>('AUTH0_AUDIENCE') || '';

    // Support multiple audiences (comma-separated) for multiple frontends
    const audienceArray = audiences.includes(',')
      ? audiences.split(',').map((a) => a.trim())
      : audiences;

    const jwksUri = `${domain}.well-known/jwks.json`;

    // Log configuration on startup
    console.log('\n=== Auth0 Strategy Configuration ===');
    console.log(`Domain: ${domain}`);
    console.log(`Audience: ${audienceArray}`);
    console.log(`JWKS URI: ${jwksUri}`);
    console.log('====================================\n');

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: audienceArray,
      issuer: domain,
      algorithms: ['RS256'],
    });
  }

  validate(payload: any) {
    this.logger.debug('JWT validation successful');
    this.logger.debug(`Token subject: ${payload.sub}`);
    this.logger.debug(`Token audience: ${payload.aud}`);
    this.logger.debug(`Token issuer: ${payload.iss}`);
    this.logger.debug(`Token email: ${payload.email}`);

    const user = {
      userId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified,
      name: payload.name,
      picture: payload.picture,
      permissions: payload.permissions || [],
      roles: payload['https://yourapp.com/roles'] || [],
    };

    this.logger.debug(`Validated user: ${user.email}`);
    return user;
  }
}
