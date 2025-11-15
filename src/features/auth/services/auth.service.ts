import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserService } from '../../user/services';
import { CreateUser, Role, User } from '../../user/models';
import { EmailService } from '../../../shared/services';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto';

export interface AuthResponse {
  accessToken: string;
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hash = await bcrypt.hash(registerDto.password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const createUser: CreateUser = {
      email: registerDto.email,
      name: registerDto.name,
    };

    const user = await this.userService.create(createUser, hash);

    // Update user with verification token
    await this.userService.update(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user || !user.hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    if (user.blocked) {
      throw new UnauthorizedException('Your account has been blocked');
    }

    const accessToken = await this.generateAccessToken(user);

    // Remove sensitive data
    delete user.hash;
    delete user.emailVerificationToken;
    delete user.passwordResetToken;

    return {
      accessToken,
      user,
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userService.findByEmailVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.userService.verifyEmail(user.id);
    await this.emailService.sendWelcomeEmail(user.email, user.name || 'User');

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      // Don't reveal if user exists
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.userService.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userService.findByPasswordResetToken(
      resetPasswordDto.token,
    );

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hash = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    await this.userService.updatePassword(user.id, hash);

    // Clear reset token
    await this.userService.update(user.id, {
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    return {
      message:
        'Password reset successfully. You can now login with your new password.',
    };
  }

  async googleLogin(googleUser: any): Promise<AuthResponse> {
    if (!googleUser) {
      throw new UnauthorizedException('No user from Google');
    }

    let user = await this.userService.findByEmail(googleUser.email);

    if (!user) {
      // Create new user from Google profile
      const createUser: CreateUser = {
        email: googleUser.email,
        name: googleUser.name,
      };

      user = await this.userService.create(createUser, ''); // No password for Google users

      // Update with Google ID and mark as verified
      await this.userService.update(user.id, {
        googleId: googleUser.googleId,
        photo: googleUser.photo,
      });

      // Mark email as verified for Google users
      user.emailVerified = true;
    } else if (!user.googleId) {
      // Link Google account to existing user
      await this.userService.update(user.id, {
        googleId: googleUser.googleId,
        photo: googleUser.photo || user.photo,
      });

      if (!user.emailVerified) {
        user.emailVerified = true;
      }
    }

    if (user.blocked) {
      throw new UnauthorizedException('Your account has been blocked');
    }

    const accessToken = await this.generateAccessToken(user);

    // Remove sensitive data
    delete user.hash;
    delete user.emailVerificationToken;
    delete user.passwordResetToken;

    return {
      accessToken,
      user,
    };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.userService.update(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    return {
      message: 'Verification email sent',
    };
  }

  private async generateAccessToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (!user || !user.hash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.hash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
}
