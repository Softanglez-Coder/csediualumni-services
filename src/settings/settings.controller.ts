import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSettingDto, UpdateSettingDto } from './dto/settings.dto';

@Controller('api/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  async createSetting(@Body() createDto: CreateSettingDto) {
    return this.settingsService.createSetting(createDto);
  }

  @Get()
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Get('membership-fee')
  async getMembershipFee() {
    return this.settingsService.getMembershipFee();
  }

  @Get('feature-flags')
  async getFeatureFlags() {
    return this.settingsService.getFeatureFlags();
  }

  @Get(':key')
  async getSetting(@Param('key') key: string) {
    return this.settingsService.getSetting(key);
  }

  @Patch(':key')
  async updateSetting(
    @Param('key') key: string,
    @Body() updateDto: UpdateSettingDto,
  ) {
    return this.settingsService.updateSetting(key, updateDto);
  }

  @Delete(':key')
  async deleteSetting(@Param('key') key: string) {
    await this.settingsService.deleteSetting(key);
    return { message: 'Setting deleted successfully' };
  }
}
