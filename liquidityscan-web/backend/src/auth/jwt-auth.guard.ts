import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (err || !user) {
      this.logger.warn(`JWT authentication failed: ${err?.message || info?.message || 'Unknown error'}`);
      this.logger.debug(`Auth header present: ${!!authHeader}`);
      if (authHeader) {
        this.logger.debug(`Auth header format: ${authHeader.substring(0, 20)}...`);
      }
      throw err || new UnauthorizedException('Authentication required');
    }

    return user;
  }
}
