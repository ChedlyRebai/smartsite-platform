import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Team } from './entities/team.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectModel(Team.name) private teamModel: Model<Team>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createTeamDto: any) {
    const createdTeam = new this.teamModel(createTeamDto);
    return createdTeam.save();
  }

  async findAll() {
    try {
      return await this.teamModel
        .find()
        .populate({
          path: 'members',
          select:
            '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt',
        })
        .populate(
          'manager',
          '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt',
        )
        .exec();
    } catch (error) {
      console.error('Error in findAll teams:', error);
      return this.teamModel.find().exec();
    }
  }

  async findById(id: string) {
    try {
      return await this.teamModel
        .findById(id)
        .populate({
          path: 'members',
          select:
            '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt',
        })
        .populate(
          'manager',
          '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt',
        )
        .exec();
    } catch (error) {
      console.error('Error in findById team:', error);
      return this.teamModel.findById(id).exec();
    }
  }

  async findByName(name: string) {
    return this.teamModel
      .findOne({ name })
      .populate({
        path: 'members',
        select:
          '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt',
      })
      .populate(
        'manager',
        '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt',
      )
      .exec();
  }

  async update(id: string, updateTeamDto: any) {
    return this.teamModel
      .findByIdAndUpdate(id, updateTeamDto, { new: true })
      .populate({
        path: 'members',
        select:
          '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt',
      })
      .populate(
        'manager',
        '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt',
      )
      .exec();
  }

  async remove(id: string) {
    return this.teamModel.findByIdAndDelete(id).exec();
  }

  async addMemberToTeam(teamId: string, memberId: string) {
    const users = await this.userModel.findByIdAndUpdate(
      memberId,
      { $push: { assignedTeam: teamId } },
      { new: true },
    );
    const team = await this.teamModel
      .findByIdAndUpdate(
        teamId,
        { $addToSet: { members: memberId } },
        { new: true },
      )
      .populate({
        path: 'members',
        select:
          '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt',
      })
      .populate(
        'manager',
        '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt',
      )
      .exec();
    return team;
  }

  async getTeamsBySite(siteId: string) {
    return this.teamModel
      .find({ site: siteId })
      .populate({
        path: 'members',
        select: 'firstName lastName email',
      })
      .populate('manager', 'firstName lastName')
      .lean();
  }

  // Backward compatible alias.
  async getUsersBySiteWithTeams(siteId: string) {
    return this.getTeamsBySite(siteId);
  }

  
  async removeMemberFromTeam(teamId: string, memberId: string) {
    return this.teamModel
      .findByIdAndUpdate(
        teamId,
        { $pull: { members: memberId } },
        { new: true },
      )
      .populate({
        path: 'members',
        select:
          '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt',
      })
      .populate(
        'manager',
        '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt',
      )
      .exec();
  }

  async setManager(teamId: string, managerId: string) {
    return this.teamModel
      .findByIdAndUpdate(teamId, { manager: managerId }, { new: true })
      .populate({
        path: 'members',
        select:
          '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt',
      })
      .populate(
        'manager',
        '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt',
      )
      .exec();
  }

  // Note: assignSite method - updates the Team document with the assigned site
  async assignSite(teamId: string, siteId: string) {
    const team = await this.teamModel.findById(teamId);

    if (!team) throw new Error('Team not found');

    const updateTeam = await this.teamModel.findByIdAndUpdate(
      teamId,
      {
        site: siteId,
      },
      { new: true },
    );

    const updateTeamMembers = await this.userModel.updateMany(
      { _id: { $in: team.members } },
      { assignedSite: siteId },
    );

    return updateTeam;
  }

  // Remove site assignment from team
  async removeSite(teamId: string) {
    return this.teamModel
      .findByIdAndUpdate(teamId, { $unset: { site: 1 } }, { new: true })
      .populate({
        path: 'members',
        select:
          '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt',
      })
      .populate(
        'manager',
        '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt',
      )
      .exec();
  }
}
