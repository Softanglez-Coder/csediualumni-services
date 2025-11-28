import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from '../users.service';
import { User } from '../schemas/user.schema';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotFoundException } from '@nestjs/common';

describe('UsersService - Membership Approval', () => {
  let service: UsersService;

  const mockSave = jest.fn();
  const mockExec = jest.fn();
  const mockFindById = jest.fn();
  const mockFindOne = jest.fn();
  const mockSort = jest.fn();

  const mockUserModel = jest.fn().mockImplementation((dto) => {
    return {
      ...dto,
      save: mockSave,
    };
  });

  mockUserModel.findOne = mockFindOne;
  mockUserModel.findById = mockFindById;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue({});
    mockExec.mockResolvedValue(null);
    mockFindOne.mockReturnValue({ sort: mockSort });
    mockSort.mockReturnValue({ exec: mockExec });
    mockFindById.mockReturnValue({ exec: mockExec });

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

  describe('approveMembership', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockExec.mockResolvedValue(null);
      mockFindById.mockReturnValue({ exec: mockExec });

      await expect(service.approveMembership('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should add Member role to user', async () => {
      const mockUser = {
        _id: 'user123',
        roles: [UserRole.GUEST],
        membershipId: undefined,
        save: mockSave,
      };
      mockFindById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });
      mockFindOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });
      mockSave.mockResolvedValue(mockUser);

      await service.approveMembership('user123');

      expect(mockUser.roles).toContain(UserRole.MEMBER);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should not duplicate Member role if already present', async () => {
      const mockUser = {
        _id: 'user123',
        roles: [UserRole.GUEST, UserRole.MEMBER],
        membershipId: 'M00001',
        save: mockSave,
      };
      mockFindById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });
      mockSave.mockResolvedValue(mockUser);

      await service.approveMembership('user123');

      const memberRoleCount = mockUser.roles.filter(
        (r) => r === UserRole.MEMBER,
      ).length;
      expect(memberRoleCount).toBe(1);
    });

    it('should generate membership ID in correct format (M<5 digits>)', async () => {
      const mockUser = {
        _id: 'user123',
        roles: [UserRole.GUEST],
        membershipId: undefined,
        save: mockSave,
      };
      mockFindById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });
      mockFindOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });
      mockSave.mockResolvedValue(mockUser);

      await service.approveMembership('user123');

      expect(mockUser.membershipId).toMatch(/^M\d{5}$/);
      expect(mockUser.membershipId).toBe('M00001');
    });

    it('should generate sequential membership IDs', async () => {
      const mockUser = {
        _id: 'user123',
        roles: [UserRole.GUEST],
        membershipId: undefined,
        save: mockSave,
      };
      const existingMember = {
        membershipId: 'M00005',
      };
      mockFindById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });
      mockFindOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(existingMember),
        }),
      });
      mockSave.mockResolvedValue(mockUser);

      await service.approveMembership('user123');

      expect(mockUser.membershipId).toBe('M00006');
    });

    it('should not reassign membership ID if already assigned', async () => {
      const mockUser = {
        _id: 'user123',
        roles: [UserRole.GUEST],
        membershipId: 'M00010',
        save: mockSave,
      };
      mockFindById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });
      mockSave.mockResolvedValue(mockUser);

      await service.approveMembership('user123');

      expect(mockUser.membershipId).toBe('M00010');
    });
  });
});
