import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { MailService } from '../../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let mailService: MailService;
  let jwtService: JwtService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    isEmailVerified: true,
    isActive: true,
    roles: ['user'],
    authProvider: 'local',
    emailVerificationToken: 'test-token',
    save: jest.fn().mockResolvedValue(this),
  };

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    validatePassword: jest.fn(),
    verifyEmail: jest.fn(),
    createVerificationToken: jest.fn(),
    createOrUpdateGoogleUser: jest.fn(),
  };

  const mockMailService = {
    sendVerificationEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'Password123',
        firstName: 'New',
        lastName: 'User',
      };

      mockUsersService.create.mockResolvedValue(mockUser);
      mockMailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.firstName,
        registerDto.lastName,
      );
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
      expect(result.message).toContain('Registration successful');
    });
  });

  describe('validateUser', () => {
    it('should return null if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'notfound@example.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('should throw error if user uses social login', async () => {
      const socialUser = { ...mockUser, password: undefined };
      mockUsersService.findByEmail.mockResolvedValue(socialUser);

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return null if password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });

    it('should throw error if email not verified', async () => {
      const unverifiedUser = { ...mockUser, isEmailVerified: false };
      mockUsersService.findByEmail.mockResolvedValue(unverifiedUser);
      mockUsersService.validatePassword.mockResolvedValue(true);

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error if account is deactivated', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);
      mockUsersService.validatePassword.mockResolvedValue(true);

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return user if credentials are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const token = 'jwt.token.here';
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(mockUser as any);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser._id,
        roles: mockUser.roles,
      });
      expect(result.access_token).toEqual(token);
      expect(result.user.email).toEqual(mockUser.email);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and send welcome email', async () => {
      mockUsersService.verifyEmail.mockResolvedValue(mockUser);
      mockMailService.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await service.verifyEmail('test-token');

      expect(usersService.verifyEmail).toHaveBeenCalledWith('test-token');
      expect(mailService.sendWelcomeEmail).toHaveBeenCalled();
      expect(result.message).toContain('Email verified successfully');
    });
  });

  describe('resendVerification', () => {
    it('should throw error if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.resendVerification('notfound@example.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if email already verified', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.resendVerification('test@example.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should send verification email for unverified user', async () => {
      const unverifiedUser = { ...mockUser, isEmailVerified: false };
      mockUsersService.findByEmail.mockResolvedValue(unverifiedUser);
      mockUsersService.createVerificationToken.mockResolvedValue('new-token');
      mockMailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.resendVerification('test@example.com');

      expect(usersService.createVerificationToken).toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
      expect(result.message).toContain('Verification email sent');
    });
  });

  describe('googleLogin', () => {
    it('should throw error if no user from Google', async () => {
      const req = { user: null };

      await expect(service.googleLogin(req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should create/update Google user and return token', async () => {
      const req = {
        user: {
          googleId: 'google123',
          email: 'google@example.com',
          firstName: 'Google',
          lastName: 'User',
          profilePicture: 'https://example.com/pic.jpg',
        },
      };

      mockUsersService.createOrUpdateGoogleUser.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt.token.here');

      const result = await service.googleLogin(req);

      expect(usersService.createOrUpdateGoogleUser).toHaveBeenCalledWith(
        req.user.googleId,
        req.user.email,
        req.user.firstName,
        req.user.lastName,
        req.user.profilePicture,
      );
      expect(result.access_token).toBeDefined();
    });
  });
});
