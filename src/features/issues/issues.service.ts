import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Issue, IssueDocument } from './schemas/issue.schema';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssueStatus } from './enums/issue-status.enum';

@Injectable()
export class IssuesService {
  constructor(
    @InjectModel(Issue.name) private issueModel: Model<IssueDocument>,
  ) {}

  async create(createIssueDto: CreateIssueDto): Promise<Issue> {
    const createdIssue = new this.issueModel(createIssueDto);
    return createdIssue.save();
  }

  async findAll(status?: IssueStatus): Promise<Issue[]> {
    const filter = status ? { status } : {};
    return this.issueModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Issue | null> {
    return this.issueModel.findById(id).exec();
  }

  async update(
    id: string,
    updateIssueDto: UpdateIssueDto,
    userId?: string,
  ): Promise<Issue | null> {
    const updateData: any = { ...updateIssueDto };

    if (
      updateIssueDto.status === IssueStatus.RESOLVED ||
      updateIssueDto.status === IssueStatus.WONT_RESOLVE
    ) {
      updateData.resolvedAt = new Date();
      if (userId) {
        updateData.resolvedBy = userId;
      }
    }

    return this.issueModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<Issue | null> {
    return this.issueModel.findByIdAndDelete(id).exec();
  }

  async getStats() {
    const total = await this.issueModel.countDocuments();
    const open = await this.issueModel.countDocuments({
      status: IssueStatus.OPEN,
    });
    const inProgress = await this.issueModel.countDocuments({
      status: IssueStatus.IN_PROGRESS,
    });
    const resolved = await this.issueModel.countDocuments({
      status: IssueStatus.RESOLVED,
    });
    const wontResolve = await this.issueModel.countDocuments({
      status: IssueStatus.WONT_RESOLVE,
    });

    return {
      total,
      open,
      inProgress,
      resolved,
      wontResolve,
    };
  }
}
