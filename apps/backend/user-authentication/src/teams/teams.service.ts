import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Team } from './entities/team.entity';

@Injectable()
export class TeamsService {
  constructor(@InjectModel(Team.name) private teamModel: Model<Team>) {}

  async create(createTeamDto: any) {
    const createdTeam = new this.teamModel(createTeamDto);
    return createdTeam.save();
  }

  async findAll() {
    try {
      return await this.teamModel.find()
        .populate({
          path: 'members',
          select: '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt'
        })
        .populate('manager', '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt')
        .populate('site')
        .exec();
    } catch (error) {
      console.error('Error in findAll teams:', error);
      return this.teamModel.find().exec();
    }
  }

  async findById(id: string) {
    try {
      return await this.teamModel.findById(id)
        .populate({
          path: 'members',
          select: '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt'
        })
        .populate('manager', '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt')
        .populate('site')
        .exec();
    } catch (error) {
      console.error('Error in findById team:', error);
      return this.teamModel.findById(id).exec();
    }
  }

  async findByName(name: string) {
    return this.teamModel.findOne({ name })
      .populate({
        path: 'members',
        select: '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt'
      })
      .populate('manager', '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt')
      .populate('site')
      .exec();
  }

  async update(id: string, updateTeamDto: any) {
    return this.teamModel.findByIdAndUpdate(id, updateTeamDto, { new: true })
      .populate({
        path: 'members',
        select: '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt'
      })
      .populate('manager', '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt')
      .populate('site')
      .exec();
  }

  async remove(id: string) {
    return this.teamModel.findByIdAndDelete(id).exec();
  }

  async addMemberToTeam(teamId: string, memberId: string) {
    return this.teamModel.findByIdAndUpdate(
      teamId,
      { $addToSet: { members: memberId } },
      { new: true },
    )
      .populate({
        path: 'members',
        select: '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt'
      })
      .populate('manager', '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt')
      .populate('site')
      .exec();
  }

  async removeMemberFromTeam(teamId: string, memberId: string) {
    return this.teamModel.findByIdAndUpdate(
      teamId,
      { $pull: { members: memberId } },
      { new: true },
    )
      .populate({
        path: 'members',
        select: '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt'
      })
      .populate('manager', '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt')
      .populate('site')
      .exec();
  }

  async setManager(teamId: string, managerId: string) {
    return this.teamModel.findByIdAndUpdate(
      teamId,
      { manager: managerId },
      { new: true },
    )
      .populate({
        path: 'members',
        select: '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt'
      })
      .populate('manager', '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt')
      .populate('site')
      .exec();
  }

  async assignSite(teamId: string, siteId: string) {
    return this.teamModel.findByIdAndUpdate(
      teamId,
      { site: siteId },
      { new: true },
    )
      .populate({
        path: 'members',
        select: '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt'
      })
      .populate('manager', '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt')
      .populate('site')
      .exec();
  }
}
