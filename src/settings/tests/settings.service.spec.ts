import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService, SETTINGS_KEYS } from '../settings.service';
import { getModelToken } from '@nestjs/mongoose';
import { Settings } from '../schemas/settings.schema';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('SettingsService', () => {
  let service: SettingsService;

  const mockSetting = {
    _id: '507f1f77bcf86cd799439011',
    key: 'test_key',
    value: { testValue: 'test' },
    description: 'Test setting',
    isActive: true,
    save: jest.fn(),
  };

  const mockMembershipFeeSetting = {
    _id: '507f1f77bcf86cd799439012',
    key: SETTINGS_KEYS.MEMBERSHIP_FEE,
    value: { amount: 1000, currency: 'BDT' },
    description: 'Membership fee configuration',
    isActive: true,
  };

  const mockFeatureFlagsSetting = {
    _id: '507f1f77bcf86cd799439013',
    key: SETTINGS_KEYS.FEATURE_FLAGS,
    value: {
      enableMembershipPayment: true,
      enableEmailNotifications: true,
      enableAutoApproveIncome: true,
    },
    description: 'Feature flags',
    isActive: true,
  };

  const mockSettingsModel = jest.fn().mockImplementation((dto) => ({
    ...dto,
    _id: '507f1f77bcf86cd799439011',
    save: jest.fn().mockResolvedValue({
      ...dto,
      _id: '507f1f77bcf86cd799439011',
    }),
  }));

  mockSettingsModel.findOne = jest.fn();
  mockSettingsModel.find = jest.fn();
  mockSettingsModel.create = jest.fn();
  mockSettingsModel.deleteOne = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: getModelToken(Settings.name),
          useValue: mockSettingsModel,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSetting', () => {
    it('should throw ConflictException if setting already exists', async () => {
      mockSettingsModel.findOne.mockResolvedValue(mockSetting);

      await expect(
        service.createSetting({
          key: 'test_key',
          value: { testValue: 'test' },
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a new setting', async () => {
      mockSettingsModel.findOne.mockResolvedValue(null);

      const result = await service.createSetting({
        key: 'new_key',
        value: { newValue: 'value' },
      });

      expect(result).toBeDefined();
    });
  });

  describe('updateSetting', () => {
    it('should throw NotFoundException if setting not found', async () => {
      mockSettingsModel.findOne.mockResolvedValue(null);

      await expect(
        service.updateSetting('nonexistent', { value: { test: 'value' } }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update setting value', async () => {
      const settingWithSave = {
        ...mockSetting,
        save: jest.fn().mockResolvedValue({ ...mockSetting, value: { updated: true } }),
      };
      mockSettingsModel.findOne.mockResolvedValue(settingWithSave);

      const result = await service.updateSetting('test_key', {
        value: { updated: true },
      });

      expect(settingWithSave.save).toHaveBeenCalled();
    });
  });

  describe('getSetting', () => {
    it('should throw NotFoundException if setting not found', async () => {
      mockSettingsModel.findOne.mockResolvedValue(null);

      await expect(service.getSetting('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return setting', async () => {
      mockSettingsModel.findOne.mockResolvedValue(mockSetting);

      const result = await service.getSetting('test_key');

      expect(result).toEqual(mockSetting);
    });
  });

  describe('getSettingValue', () => {
    it('should return null if setting not found', async () => {
      mockSettingsModel.findOne.mockResolvedValue(null);

      const result = await service.getSettingValue('nonexistent');

      expect(result).toBeNull();
    });

    it('should return setting value', async () => {
      mockSettingsModel.findOne.mockResolvedValue(mockSetting);

      const result = await service.getSettingValue<{ testValue: string }>(
        'test_key',
      );

      expect(result).toEqual({ testValue: 'test' });
    });
  });

  describe('getAllSettings', () => {
    it('should return all settings', async () => {
      const execMock = jest.fn().mockResolvedValue([mockSetting]);
      const sortMock = jest.fn().mockReturnValue({ exec: execMock });
      mockSettingsModel.find.mockReturnValue({ sort: sortMock });

      const result = await service.getAllSettings();

      expect(result).toEqual([mockSetting]);
    });
  });

  describe('deleteSetting', () => {
    it('should throw NotFoundException if setting not found', async () => {
      mockSettingsModel.findOne.mockResolvedValue(null);

      await expect(service.deleteSetting('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete setting', async () => {
      mockSettingsModel.findOne.mockResolvedValue(mockSetting);
      mockSettingsModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await service.deleteSetting('test_key');

      expect(mockSettingsModel.deleteOne).toHaveBeenCalledWith({
        key: 'test_key',
      });
    });
  });

  describe('getMembershipFee', () => {
    it('should return default values when setting not found', async () => {
      mockSettingsModel.findOne.mockResolvedValue(null);

      const result = await service.getMembershipFee();

      expect(result).toEqual({ amount: 1000, currency: 'BDT' });
    });

    it('should return configured membership fee', async () => {
      mockSettingsModel.findOne.mockResolvedValue(mockMembershipFeeSetting);

      const result = await service.getMembershipFee();

      expect(result).toEqual({ amount: 1000, currency: 'BDT' });
    });
  });

  describe('getFeatureFlags', () => {
    it('should return default values when setting not found', async () => {
      mockSettingsModel.findOne.mockResolvedValue(null);

      const result = await service.getFeatureFlags();

      expect(result).toEqual({
        enableMembershipPayment: true,
        enableEmailNotifications: true,
        enableAutoApproveIncome: true,
      });
    });

    it('should return configured feature flags', async () => {
      mockSettingsModel.findOne.mockResolvedValue(mockFeatureFlagsSetting);

      const result = await service.getFeatureFlags();

      expect(result).toEqual({
        enableMembershipPayment: true,
        enableEmailNotifications: true,
        enableAutoApproveIncome: true,
      });
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return false for unknown feature', async () => {
      mockSettingsModel.findOne.mockResolvedValue(mockFeatureFlagsSetting);

      const result = await service.isFeatureEnabled('unknownFeature');

      expect(result).toBe(false);
    });

    it('should return true for enabled feature', async () => {
      mockSettingsModel.findOne.mockResolvedValue(mockFeatureFlagsSetting);

      const result = await service.isFeatureEnabled('enableMembershipPayment');

      expect(result).toBe(true);
    });
  });
});
