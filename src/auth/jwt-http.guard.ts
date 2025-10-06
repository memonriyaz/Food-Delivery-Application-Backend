import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtHttpAuthGuard extends AuthGuard('jwt') {
  handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): any {
    const req = context.switchToHttp().getRequest();

    // console.log('Headers:', req.headers);
    // console.log('User from strategy:', user);
    // console.log('Info:', info);
    if (err || !user) {
      const message =
        err?.message || info?.message || 'Invalid or missing token';
      throw new UnauthorizedException(message);
    }
    return user;
  }
}
