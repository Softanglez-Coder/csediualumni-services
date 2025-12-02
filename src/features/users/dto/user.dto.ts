import {
  IsEmail,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsUrl,
  IsBoolean,
  Matches,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../enums/user.enum';

export class CreateUserDto {
  @IsString()
  auth0Id: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  picture?: string;

  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;
}

export class UpdateUserProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  graduationYear?: number;

  @IsString()
  @IsOptional()
  @Matches(/^(D|E)-\d+$/, {
    message:
      'Batch must be in format D-42 or E-42 (Day/Evening - batch number)',
  })
  batch?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  currentCompany?: string;

  @IsString()
  @IsOptional()
  currentPosition?: string;

  @IsUrl()
  @IsOptional()
  linkedinUrl?: string;

  @IsUrl()
  @IsOptional()
  githubUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];
}

export class UpdateUserRolesDto {
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles: UserRole[];
}
