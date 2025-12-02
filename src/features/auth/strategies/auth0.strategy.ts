import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Auth0Strategy extends PassportStrategy(Strategy, 'auth0') {
  constructor(private configService: ConfigService) {
    const audiences = configService.get<string>('AUTH0_AUDIENCE') || '';
    // Support multiple audiences (comma-separated) for multiple frontends
    const audienceArray = audiences.includes(',')
      ? audiences.split(',').map((a) => a.trim())
      : audiences;

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get<string>('AUTH0_DOMAIN')}.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: audienceArray,
      issuer: configService.get<string>('AUTH0_DOMAIN'),
      algorithms: ['RS256'],
    });
  }

  validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified,
      name: payload.name,
      picture: payload.picture,
      permissions: payload.permissions || [],
      roles: payload['https://yourapp.com/roles'] || [],
    };
  }
}
