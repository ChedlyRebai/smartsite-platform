import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private auditLogsService: AuditLogsService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    const user = await this.authService.validateUser(
      loginDto.cin,
      loginDto.password,
    );
    if (!user) {
      await this.auditLogsService.createLog({
        userCin: loginDto.cin,
        actionType: 'login',
        actionLabel: 'Login failed',
        resourceType: 'auth',
        status: 'failed',
        severity: 'critical',
        ipAddress: req?.ip,
        details: 'Invalid credentials or pending account',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const result = await this.authService.login(user);
    await this.auditLogsService.createLog({
      userId: String(user?._id || ''),
      userCin: user?.cin,
      userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      userRole: user?.role?.name,
      actionType: 'login',
      actionLabel: 'User logged in',
      resourceType: 'auth',
      status: 'success',
      severity: 'normal',
      ipAddress: req?.ip,
      sessionId: result.session_id,
    });
    return result;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Body() body: { sessionId?: string }, @Request() req: any) {
    const userId = String(req?.user?.sub || req?.user?.userId || '');
    const loginLog = await this.auditLogsService.findLatestLogin(
      userId,
      body?.sessionId,
    );
    const durationSec = loginLog
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date((loginLog as any).createdAt).getTime()) /
              1000,
          ),
        )
      : undefined;
    await this.auditLogsService.createLog({
      userId,
      actionType: 'logout',
      actionLabel: 'User logged out',
      resourceType: 'auth',
      status: 'success',
      severity: 'normal',
      ipAddress: req?.ip,
      sessionId: body?.sessionId,
      sessionDurationSec: durationSec,
      details:
        durationSec != null ? `Session duration: ${durationSec}s` : undefined,
    });
    return { message: 'Logout tracked' };
  }

  @Post('register')
  async register(@Body() registerDto: any, @Request() req: any) {
    const {
      cin,
      password,
      firstName,
      lastName,
      email,
      telephone,
      phoneNumber,
      departement,
      address,
      role,
      companyName,
    } = registerDto;

    const user = await this.authService.register(
      cin,
      password ?? '',
      firstName,
      lastName,
      email,
      telephone ?? phoneNumber,
      departement,
      address,
      role,
      companyName,
    );

    const response = {
      message: 'User registered successfully',
      user: {
        id: user._id,
        cin: user.cin,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        telephone: user.phoneNumber,
        address: user.address,
        role: user.role,
        companyName: user.companyName,
      },
    };

    await this.auditLogsService.createLog({
      userId: String(user._id),
      userCin: user.cin,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      actionType: 'create',
      actionLabel: 'User registered (pending approval)',
      resourceType: 'user',
      resourceId: String(user._id),
      status: 'success',
      severity: 'important',
      ipAddress: req?.ip,
    });
    return response;
  }

  @Post('approve-user/:userId')
  @UseGuards(JwtAuthGuard)
  async approveUser(
    @Param('userId') userId: string,
    @Body() body: { password: string },
    @Request() req: any,
  ) {
    const adminId = req.user.userId;
    const updatedUser = await this.authService.approveUser(
      userId,
      body.password,
      adminId,
    );
    await this.auditLogsService.createLog({
      userId: String(adminId),
      userName: 'Super Admin',
      actionType: 'update',
      actionLabel: 'Approved user account',
      resourceType: 'user',
      resourceId: userId,
      status: 'success',
      severity: 'important',
      ipAddress: req?.ip,
    });
    return {
      message: 'User approved successfully',
      user: updatedUser,
    };
  }

  @Post('reject-user/:userId')
  @UseGuards(JwtAuthGuard)
  async rejectUser(
    @Param('userId') userId: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    const updatedUser = await this.authService.rejectUser(userId, body.reason);
    await this.auditLogsService.createLog({
      userId: String(req?.user?.sub || ''),
      userName: 'Super Admin',
      actionType: 'update',
      actionLabel: 'Rejected user account',
      resourceType: 'user',
      resourceId: userId,
      status: 'success',
      severity: 'important',
      ipAddress: req?.ip,
      details: body.reason,
    });
    return {
      message: 'User rejected successfully',
      user: updatedUser,
    };
  }
}
