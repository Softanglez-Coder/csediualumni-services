import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  login(user: UserDocument) {
    const payload = {
      email: user.email,
      sub: user._id,
      roles: user.roles,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async googleLogin(req: GoogleUser) {
    if (!req.user) {
      throw new UnauthorizedException('No user from Google');
    }

    const user = await this.usersService.createOrUpdateGoogleUser(
      req.user.googleId,
      req.user.email,
      req.user.firstName,
      req.user.lastName,
      req.user.profilePicture,
    );

    return this.login(user);
  }
}

export interface GoogleUser {
  user: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
}
