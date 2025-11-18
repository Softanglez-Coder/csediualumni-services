import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from '../users.service';
import { User, UserDocument } from '../schemas/user.schema';
import { UserRole } from '../../common/enums/user-role.enum';

describe('UsersService - System Admin', () => {
  let service: UsersService;

  const mockSave = jest.fn();
  const mockExec = jest.fn();
  const mockFindOne = jest.fn();

  const mockUserModel = jest.fn().mockImplementation((dto) => {
    return {
      ...dto,
      save: mockSave,
    };
  });

  mockUserModel.findOne = mockFindOne;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue({});
    mockExec.mockResolvedValue(null);
    mockFindOne.mockReturnValue({ exec: mockExec });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('ensureSystemAdminExists', () => {
    const systemAdminData = {
      email: 'system-admin@csediualumni.com',
      password: 'secure-password',
      firstName: 'System',
      lastName: 'Administrator',
    };

    it('should create a new system admin bot user if it does not exist', async () => {
      mockExec.mockResolvedValue(null);

      mockSave.mockResolvedValue({
        _id: 'mock-system-admin-id',
        email: systemAdminData.email.toLowerCase(),
        firstName: systemAdminData.firstName,
        lastName: systemAdminData.lastName,
        isSystemBot: true,
        isEmailVerified: true,
        isActive: true,
        roles: [UserRole.SYSTEM_ADMIN],
      });

      const result = await service.ensureSystemAdminExists(
        systemAdminData.email,
        systemAdminData.password,
        systemAdminData.firstName,
        systemAdminData.lastName,
      );

      expect(mockFindOne).toHaveBeenCalledWith({
        email: systemAdminData.email.toLowerCase(),
        isSystemBot: true,
      });
      expect(mockExec).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should update existing system admin bot user if it exists', async () => {
      const existingSystemAdmin = {
        _id: 'existing-id',
        email: systemAdminData.email.toLowerCase(),
        password: 'old-hashed-password',
        firstName: 'Old',
        lastName: 'Name',
        isSystemBot: true,
        isEmailVerified: true,
        isActive: false,
        roles: [UserRole.GUEST],
        save: jest.fn().mockResolvedValue({
          _id: 'existing-id',
          email: systemAdminData.email.toLowerCase(),
          firstName: systemAdminData.firstName,
          lastName: systemAdminData.lastName,
          isSystemBot: true,
          isEmailVerified: true,
          isActive: true,
          roles: [UserRole.SYSTEM_ADMIN],
        }),
      };

      mockExec.mockResolvedValue(existingSystemAdmin);

      const result = await service.ensureSystemAdminExists(
        systemAdminData.email,
        systemAdminData.password,
        systemAdminData.firstName,
        systemAdminData.lastName,
      );

      expect(mockFindOne).toHaveBeenCalledWith({
        email: systemAdminData.email.toLowerCase(),
        isSystemBot: true,
      });
      expect(existingSystemAdmin.save).toHaveBeenCalled();
      expect(existingSystemAdmin.firstName).toBe(systemAdminData.firstName);
      expect(existingSystemAdmin.lastName).toBe(systemAdminData.lastName);
      expect(existingSystemAdmin.isActive).toBe(true);
      expect(existingSystemAdmin.isEmailVerified).toBe(true);
      expect(existingSystemAdmin.roles).toEqual([UserRole.SYSTEM_ADMIN]);
    });

    it('should set correct properties for system admin bot user', async () => {
      mockExec.mockResolvedValue(null);

      const capturedData: any[] = [];
      mockUserModel.mockImplementation((dto) => {
        capturedData.push(dto);
        return {
          ...dto,
          save: mockSave.mockResolvedValue({
            _id: 'mock-id',
            ...dto,
          }),
        };
      });

      await service.ensureSystemAdminExists(
        systemAdminData.email,
        systemAdminData.password,
        systemAdminData.firstName,
        systemAdminData.lastName,
      );

      expect(capturedData.length).toBeGreaterThan(0);
      const createdUser = capturedData[capturedData.length - 1];
      expect(createdUser.email).toBe(systemAdminData.email.toLowerCase());
      expect(createdUser.firstName).toBe(systemAdminData.firstName);
      expect(createdUser.lastName).toBe(systemAdminData.lastName);
      expect(createdUser.isSystemBot).toBe(true);
      expect(createdUser.isEmailVerified).toBe(true);
      expect(createdUser.isActive).toBe(true);
      expect(createdUser.roles).toEqual([UserRole.SYSTEM_ADMIN]);
      expect(createdUser.authProvider).toBe('local');
    });
  });
});

