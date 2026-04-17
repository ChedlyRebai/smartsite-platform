import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
    if (!Types.ObjectId.isValid(teamId)) {
      throw new BadRequestException('Identifiant d’équipe invalide');
    }
    if (!Types.ObjectId.isValid(memberId)) {
      throw new BadRequestException(
        'Identifiant utilisateur invalide — utilisez l’ID MongoDB du compte (24 caractères hexadécimaux), pas un identifiant de démo.',
      );
    }
    const memberObjectId = new Types.ObjectId(memberId);
    const updated = await this.teamModel
      .findByIdAndUpdate(
        teamId,
        { $addToSet: { members: memberObjectId } },
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
    if (!updated) {
      throw new NotFoundException('Équipe introuvable');
    }
    return updated;
  }

  async removeMemberFromTeam(teamId: string, memberId: string) {
    if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(memberId)) {
      throw new BadRequestException('Identifiant invalide');
    }
    const updated = await this.teamModel
      .findByIdAndUpdate(
        teamId,
        { $pull: { members: new Types.ObjectId(memberId) } },
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
    if (!updated) {
      throw new NotFoundException('Équipe introuvable');
    }
    return updated;
  }

  async setManager(teamId: string, managerId: string) {
    if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(managerId)) {
      throw new BadRequestException('Identifiant invalide');
    }
    const updated = await this.teamModel
      .findByIdAndUpdate(
        teamId,
        { manager: new Types.ObjectId(managerId) },
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
    if (!updated) {
      throw new NotFoundException('Équipe introuvable');
    }
    return updated;
  }

  // Assign a site to a team (one-way: team.site = siteId)
  async assignSite(teamId: string, siteId: string) {
    if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(siteId)) {
      throw new BadRequestException('Identifiant invalide');
    }
    const updated = await this.teamModel
      .findByIdAndUpdate(
        teamId,
        { site: new Types.ObjectId(siteId) },
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
    if (!updated) {
      throw new NotFoundException('Équipe introuvable');
    }
    return updated;
  }

  // Remove site assignment from team (one-way: unset team.site)
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
