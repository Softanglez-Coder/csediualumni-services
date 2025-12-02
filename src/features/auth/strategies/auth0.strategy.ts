import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Auth0Strategy extends PassportStrategy(Strategy, 'auth0') {
  private readonly logger = new Logger(Auth0Strategy.name);

  constructor(private configService: ConfigService) {
    let domain = configService.get<string>('AUTH0_DOMAIN');
    const audiences = configService.get<string>('AUTH0_AUDIENCE') || '';

    if (!domain) {
      throw new Error('AUTH0_DOMAIN is not configured');
    }

    // Ensure domain has trailing slash
    if (!domain.endsWith('/')) {
      domain = `${domain}/`;
    }

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

    // Auth0 access tokens may have standard claims or custom claims
    // Try standard claims first, then fall back to custom claim namespace
    const email = payload.email || payload['https://api.csedialumni.com/email'];
    const name = payload.name || payload['https://api.csedialumni.com/name'];
    const picture =
      payload.picture || payload['https://api.csedialumni.com/picture'];
    const emailVerified =
      payload.email_verified ??
      payload['https://api.csedialumni.com/email_verified'];

    this.logger.debug(`Token email: ${email}`);
    this.logger.debug(`Token name: ${name}`);

    const user = {
      sub: payload.sub, // Keep the 'sub' field for UsersService
      userId: payload.sub,
      email,
      emailVerified,
      name,
      picture,
      permissions: payload.permissions || [],
      roles: payload['https://yourapp.com/roles'] || [],
    };

    this.logger.debug(`Validated user: ${user.email}`);

    if (!user.email) {
      this.logger.warn(
        'Email claim not found in token. Ensure Auth0 Action adds email to access token.',
      );
    }

    return user;
  }
}
