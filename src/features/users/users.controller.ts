import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Auth0Guard } from '../auth/guards/auth0.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserProfileDto } from './dto/user.dto';

@Controller('users')
@UseGuards(Auth0Guard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMyProfile(@CurrentUser() user: any) {
    // Ensure user exists in database (create if first login)
    const dbUser = await this.usersService.findOrCreate(user);
    return dbUser;
  }

  @Put('me')
  async updateMyProfile(
    @CurrentUser('userId') auth0Id: string,
    @Body() updateDto: UpdateUserProfileDto,
  ) {
    return this.usersService.updateProfile(auth0Id, updateDto);
  }

  @Get()
  async getAllUsers(
    @Query('graduationYear') graduationYear?: string,
    @Query('batch') batch?: string,
    @Query('roles') roles?: string | string[],
  ) {
    const filters: any = {};
    if (graduationYear) filters.graduationYear = parseInt(graduationYear);
    if (batch) filters.batch = batch;
    if (roles) {
      filters.roles = Array.isArray(roles) ? roles : [roles];
    }

    return this.usersService.findAll(filters);
  }

  @Get('search')
  async searchUsers(@Query('q') searchTerm: string) {
    if (!searchTerm) {
      return [];
    }
    return this.usersService.search(searchTerm);
  }

  @Get(':id')
  async getUserById(@Param('id') auth0Id: string) {
    return this.usersService.findByAuth0Id(auth0Id);
  }
}
