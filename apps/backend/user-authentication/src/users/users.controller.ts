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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('users')
//@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  @Post()
  async create(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
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

  @Get('me')
  async getCurrentUser(@Headers('Authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No token provided' };
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = this.jwtService.verify(token);
      const userId = decoded.sub;
      const user = await this.usersService.findById(userId);
      
      if (!user) {
        return { error: 'User not found' };
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword;
    } catch (error) {
      return { error: 'Invalid token' };
    }
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
      
      
      const { password, role, status, approvedBy, approvedAt, emailVerificationOtp, otpExpiresAt, ...allowedUpdates } = updateData;
      
      const updatedUser = await this.usersService.update(userId, allowedUpdates);
      
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
  async createUserWithTemporaryPassword(@Body() createUserDto: any): Promise<any> {
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
  async update(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Put('ban/:id')
  async ban(@Param('id') id: string) {
    return this.usersService.handleBan(id);
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

