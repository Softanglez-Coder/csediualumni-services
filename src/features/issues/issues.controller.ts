import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssueStatus } from './enums/issue-status.enum';
import { Public } from '../auth/decorators/public.decorator';
import { Auth0Guard } from '../auth/guards/auth0.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Public()
  @Post()
  create(@Body() createIssueDto: CreateIssueDto) {
    return this.issuesService.create(createIssueDto);
  }

  @UseGuards(Auth0Guard)
  @Get()
  findAll(@Query('status') status?: IssueStatus) {
    return this.issuesService.findAll(status);
  }

  @UseGuards(Auth0Guard)
  @Get('stats')
  getStats() {
    return this.issuesService.getStats();
  }

  @UseGuards(Auth0Guard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.issuesService.findOne(id);
  }

  @UseGuards(Auth0Guard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIssueDto: UpdateIssueDto,
    @CurrentUser() user?: any,
  ) {
    return this.issuesService.update(id, updateIssueDto, user?.sub);
  }

  @UseGuards(Auth0Guard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.issuesService.delete(id);
  }
}
