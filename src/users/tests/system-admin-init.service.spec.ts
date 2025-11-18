import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SystemAdminInitService } from '../system-admin-init.service';
import { UsersService } from '../users.service';
import { UserRole } from '../../common/enums/user-role.enum';

describe('SystemAdminInitService', () => {
  let service: SystemAdminInitService;
  let usersService: UsersService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockUsersService = {
    ensureSystemAdminExists: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemAdminInitService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SystemAdminInitService>(SystemAdminInitService);
    usersService = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize system admin on module init', async () => {
      mockConfigService.get
        .mockReturnValueOnce('system-admin@csediualumni.com')
        .mockReturnValueOnce('secure-password')
        .mockReturnValueOnce('System')
        .mockReturnValueOnce('Administrator');

      mockUsersService.ensureSystemAdminExists.mockResolvedValue({
        _id: 'mock-id',
        email: 'system-admin@csediualumni.com',
        firstName: 'System',
        lastName: 'Administrator',
        isSystemBot: true,
        roles: [UserRole.SYSTEM_ADMIN],
      });

      await service.onModuleInit();

      expect(mockConfigService.get).toHaveBeenCalledWith('systemAdmin.email');
      expect(mockConfigService.get).toHaveBeenCalledWith(
        'systemAdmin.password',
      );
      expect(mockConfigService.get).toHaveBeenCalledWith(
        'systemAdmin.firstName',
      );
      expect(mockConfigService.get).toHaveBeenCalledWith(
        'systemAdmin.lastName',
      );
      expect(mockUsersService.ensureSystemAdminExists).toHaveBeenCalledWith(
        'system-admin@csediualumni.com',
        'secure-password',
        'System',
        'Administrator',
      );
    });

    it('should skip initialization if email is not configured', async () => {
      mockConfigService.get
        .mockReturnValueOnce(null)
        .mockReturnValueOnce('secure-password')
        .mockReturnValueOnce('System')
        .mockReturnValueOnce('Administrator');

      await service.onModuleInit();

      expect(mockUsersService.ensureSystemAdminExists).not.toHaveBeenCalled();
    });

    it('should skip initialization if password is not configured', async () => {
      mockConfigService.get
        .mockReturnValueOnce('system-admin@csediualumni.com')
        .mockReturnValueOnce(null)
        .mockReturnValueOnce('System')
        .mockReturnValueOnce('Administrator');

      await service.onModuleInit();

      expect(mockUsersService.ensureSystemAdminExists).not.toHaveBeenCalled();
    });

    it('should not throw error if initialization fails', async () => {
      mockConfigService.get
        .mockReturnValueOnce('system-admin@csediualumni.com')
        .mockReturnValueOnce('secure-password')
        .mockReturnValueOnce('System')
        .mockReturnValueOnce('Administrator');

      mockUsersService.ensureSystemAdminExists.mockRejectedValue(
        new Error('Database error'),
      );

      // Should not throw
      await expect(service.onModuleInit()).resolves.not.toThrow();
    });

    it('should use default values for firstName and lastName if not configured', async () => {
      mockConfigService.get
        .mockReturnValueOnce('system-admin@csediualumni.com')
        .mockReturnValueOnce('secure-password')
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined);

      mockUsersService.ensureSystemAdminExists.mockResolvedValue({
        _id: 'mock-id',
        email: 'system-admin@csediualumni.com',
        firstName: 'System',
        lastName: 'Administrator',
        isSystemBot: true,
        roles: [UserRole.SYSTEM_ADMIN],
      });

      await service.onModuleInit();

      expect(mockUsersService.ensureSystemAdminExists).toHaveBeenCalledWith(
        'system-admin@csediualumni.com',
        'secure-password',
        'System',
        'Administrator',
      );
    });
  });
});
