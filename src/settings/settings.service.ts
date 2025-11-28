import {
  Injectable,
  NotFoundException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from './schemas/settings.schema';
import { CreateSettingDto, UpdateSettingDto } from './dto/settings.dto';

// Default settings keys
export const SETTINGS_KEYS = {
  MEMBERSHIP_FEE: 'membership_fee',
  FEATURE_FLAGS: 'feature_flags',
} as const;

// Default settings values
const DEFAULT_SETTINGS = [
  {
    key: SETTINGS_KEYS.MEMBERSHIP_FEE,
    value: {
      amount: 1000,
      currency: 'BDT',
    },
    description: 'Membership fee configuration',
    isActive: true,
  },
  {
    key: SETTINGS_KEYS.FEATURE_FLAGS,
    value: {
      enableMembershipPayment: true,
      enableEmailNotifications: true,
      enableAutoApproveIncome: true,
    },
    description: 'Feature flags for enabling/disabling system features',
    isActive: true,
  },
];

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectModel(Settings.name)
    private settingsModel: Model<SettingsDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    // Initialize default settings if they don't exist
    for (const setting of DEFAULT_SETTINGS) {
      const existing = await this.settingsModel.findOne({ key: setting.key });
      if (!existing) {
        await this.settingsModel.create(setting);
      }
    }
  }

  async createSetting(createDto: CreateSettingDto): Promise<SettingsDocument> {
    const existing = await this.settingsModel.findOne({ key: createDto.key });
    if (existing) {
      throw new ConflictException(
        `Setting with key '${createDto.key}' already exists`,
      );
    }

    const setting = new this.settingsModel(createDto);
    return setting.save();
  }

  async updateSetting(
    key: string,
    updateDto: UpdateSettingDto,
  ): Promise<SettingsDocument> {
    const setting = await this.settingsModel.findOne({ key });
    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    if (updateDto.value !== undefined) setting.value = updateDto.value;
    if (updateDto.description !== undefined)
      setting.description = updateDto.description;
    if (updateDto.isActive !== undefined) setting.isActive = updateDto.isActive;

    return setting.save();
  }

  async getSetting(key: string): Promise<SettingsDocument> {
    const setting = await this.settingsModel.findOne({ key });
    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }
    return setting;
  }

  async getSettingValue<T>(key: string): Promise<T | null> {
    const setting = await this.settingsModel.findOne({ key, isActive: true });
    if (!setting) {
      return null;
    }
    return setting.value as T;
  }

  async getAllSettings(): Promise<SettingsDocument[]> {
    return this.settingsModel.find().sort({ key: 1 }).exec();
  }

  async deleteSetting(key: string): Promise<void> {
    const setting = await this.settingsModel.findOne({ key });
    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }
    await this.settingsModel.deleteOne({ key });
  }

  // Helper methods for commonly used settings
  async getMembershipFee(): Promise<{ amount: number; currency: string }> {
    const setting = await this.getSettingValue<{
      amount: number;
      currency: string;
    }>(SETTINGS_KEYS.MEMBERSHIP_FEE);
    return setting || { amount: 1000, currency: 'BDT' };
  }

  async getFeatureFlags(): Promise<Record<string, boolean>> {
    const setting = await this.getSettingValue<Record<string, boolean>>(
      SETTINGS_KEYS.FEATURE_FLAGS,
    );
    return (
      setting || {
        enableMembershipPayment: true,
        enableEmailNotifications: true,
        enableAutoApproveIncome: true,
      }
    );
  }

  async isFeatureEnabled(featureName: string): Promise<boolean> {
    const flags = await this.getFeatureFlags();
    return flags[featureName] ?? false;
  }
}
