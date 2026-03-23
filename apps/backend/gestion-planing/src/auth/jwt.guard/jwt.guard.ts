import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
//   handleRequest<TUser = any>(
//     err: any,
//     user: any,
//     info: { message?: string },
//     _context: ExecutionContext,
//     _status?: any,
//   ): TUser {
//     if (err || !user) {
//       throw err || new UnauthorizedException(info?.message || 'Unauthorized');
//     }

//     return user as TUser;
//   }
}
