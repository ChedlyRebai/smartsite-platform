import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Headers,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { GetUser } from '../auth/strategies/get-user.decorator';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
}
@Controller('users')
//@UseGuards(JwtAuthGuard)
//@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private auditLogsService: AuditLogsService,
  ) {}

  @Post()
  async create(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll() {
    try {
      return await this.usersService.findAll();
    } catch (error) {
      console.error('Erreur dans findAll:', error);
      throw error;
    }
  }

  @Get('cin/:cin')
  async findByCin(@Param('cin') cin: string) {
    try {
      return await this.usersService.findByCin(cin);
    } catch (error) {
      console.error('Erreur dans findByCin:', error);
      throw error;
    }
  }
  //http://localhost:3000/users/mypermissions/${url}

  @Get('acessurl/:url')
  async getMyPermissionsByUrl(
    @Headers('Authorization') authHeader: string,
    @Param('url') url: string,
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No token provided' };
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = this.jwtService.verify(token);
      const userId = decoded.sub;
      console.log('DEBUG: userId:', userId, 'url:', url);
      return this.usersService.accestOthisSite(userId, url);
    } catch (error) {
      return { error: 'Invalid token' };
    }
  }
  @Get('mypermissions')
  async getProfile(@Headers('Authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No token provided' };
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = this.jwtService.verify(token);
      const userId = decoded.sub;
      return this.usersService.mypermission(userId);
    } catch (error) {
      return { error: 'Invalid token' };
    }
  }


  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@GetUser() user: any) {
    console.log('User from tokensss:', user);

    const userId = user.sub || user?.userId || user.id || user._id;

    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }
    const findeduser = await this.usersService.findById(userId);
    console.log('Found user:', findeduser);
    return findeduser;
  }

  @Put('me')
  async updateCurrentUser(
    @Headers('Authorization') authHeader: string,
    @Body() updateData: any,
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No token provided' };
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = this.jwtService.verify(token);
      const userId = decoded.sub;

      const {
        password,
        role,
        status,
        approvedBy,
        approvedAt,
        emailVerificationOtp,
        otpExpiresAt,
        ...allowedUpdates
      } = updateData;

      const updatedUser = await this.usersService.update(
        userId,
        allowedUpdates,
      );

      if (!updatedUser) {
        return { error: 'Failed to update user' };
      }

      const { password: pwd, ...userWithoutPassword } = updatedUser.toObject();
      return userWithoutPassword;
    } catch (error) {
      return { error: 'Invalid token' };
    }
  }

  @Put('me/password')
  async changePassword(
    @Headers('Authorization') authHeader: string,
    @Body() passwordData: { currentPassword: string; newPassword: string },
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No token provided' };
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = this.jwtService.verify(token);
      const userId = decoded.sub;
      return await this.usersService.changePassword(
        userId,
        passwordData.currentPassword,
        passwordData.newPassword,
      );
    } catch (error: any) {
      return { error: error.message || 'Failed to change password' };
    }
  }

  @Post('create-with-temp-password')
  async createUserWithTemporaryPassword(
    @Body() createUserDto: any,
  ): Promise<any> {
    return this.usersService.createUserWithTemporaryPassword(createUserDto);
  }

  @Get('pending')
  async findPending() {
    return this.usersService.findPending();
  }

  @Get('clients')
  async getAllClients() {
    return this.usersService.getAllclients();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: any,
    @Req() req: any,
  ) {
    const updated = await this.usersService.update(id, updateUserDto);
    await this.auditLogsService.createLog({
      userId: String(req?.user?.sub || ''),
      actionType: 'update',
      actionLabel: 'Updated user record',
      resourceType: 'user',
      resourceId: id,
      severity: 'important',
      ipAddress: req?.ip,
    });
    return updated;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const deleted = await this.usersService.remove(id);
    await this.auditLogsService.createLog({
      userId: String(req?.user?.sub || ''),
      actionType: 'delete',
      actionLabel: 'Deleted user record',
      resourceType: 'user',
      resourceId: id,
      severity: 'critical',
      ipAddress: req?.ip,
    });
    return deleted;
  }

  @Put('ban/:id')
  async ban(@Param('id') id: string, @Req() req: any) {
    const user = await this.usersService.handleBan(id);
    await this.auditLogsService.createLog({
      userId: String(req?.user?.sub || ''),
      actionType: 'update',
      actionLabel: 'Toggled user active status',
      resourceType: 'user',
      resourceId: id,
      severity: 'important',
      ipAddress: req?.ip,
    });
    return user;
  }

  // ============ TEAM ASSIGNMENT ENDPOINTS ============

  /**
   * Assign a manager to a user
   */
  @Post(':id/manager')
  async assignManager(
    @Param('id') userId: string,
    @Body() body: { managerId: string },
  ) {
    return this.usersService.assignManager(userId, body.managerId);
  }

  /**
   * Modify a user's manager
   */
  @Put(':id/manager')
  async modifyManager(
    @Param('id') userId: string,
    @Body() body: { managerId: string },
  ) {
    return this.usersService.modifyManager(userId, body.managerId);
  }

  /**
   * View a user's manager
   */
  @Get(':id/manager')
  async getManager(@Param('id') userId: string) {
    return this.usersService.getManager(userId);
  }

  /**
   * Set responsibilities for a user
   */
  @Put(':id/responsibilities')
  async setResponsibilities(
    @Param('id') userId: string,
    @Body() body: { responsibilities: string },
  ) {
    return this.usersService.setResponsibilities(userId, body.responsibilities);
  }

  /**
   * Get users by site
   */
  @Get('site/:siteId')
  async getUsersBySite(@Param('siteId') siteId: string) {
    return this.usersService.getUsersBySite(siteId);
  }

  /**
   * Assign user to a site
   */
  @Post(':id/site')
  async assignToSite(
    @Param('id') userId: string,
    @Body() body: { siteId: string },
  ) {
    return this.usersService.assignToSite(userId, body.siteId);
  }

  /**
   * Remove user from a site
   */
  @Delete(':id/site')
  async removeFromSite(@Param('id') userId: string) {
    return this.usersService.removeFromSite(userId);
  }
}
