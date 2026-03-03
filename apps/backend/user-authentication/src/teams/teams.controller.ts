import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('teams')
// @UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post()
  async create(@Body() createTeamDto: any) {
    return this.teamsService.create(createTeamDto);
  }

  @Get()
  async findAll() {
    return this.teamsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.teamsService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTeamDto: any) {
    return this.teamsService.update(id, updateTeamDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }

  @Post(':teamId/members/:memberId')
  async addMember(@Param('teamId') teamId: string, @Param('memberId') memberId: string) {
    return this.teamsService.addMemberToTeam(teamId, memberId);
  }

  @Delete(':teamId/members/:memberId')
  async removeMember(@Param('teamId') teamId: string, @Param('memberId') memberId: string) {
    return this.teamsService.removeMemberFromTeam(teamId, memberId);
  }

  @Put(':teamId/manager/:managerId')
  async setManager(@Param('teamId') teamId: string, @Param('managerId') managerId: string) {
    return this.teamsService.setManager(teamId, managerId);
  }

  @Put(':teamId/site/:siteId')
  async assignSite(@Param('teamId') teamId: string, @Param('siteId') siteId: string) {
    return this.teamsService.assignSite(teamId, siteId);
  }
}
