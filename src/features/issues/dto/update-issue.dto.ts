import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IssueStatus } from '../enums/issue-status.enum';

export class UpdateIssueDto {
  @IsEnum(IssueStatus)
  @IsOptional()
  status?: IssueStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
