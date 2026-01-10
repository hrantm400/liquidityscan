import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

/**
 * Admin Guard - checks if user's email is in ADMIN_EMAILS list
 * Only allows access to users whose email is in the environment variable
 */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);
  private readonly adminEmails: string[];

  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {
    const adminEmailsEnv = this.configService.get<string>('ADMIN_EMAILS');
    if (!adminEmailsEnv) {
      this.logger.warn('ADMIN_EMAILS not configured in environment');
      this.adminEmails = [];
    } else {
      this.adminEmails = adminEmailsEnv
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(email => email.length > 0);
      this.logger.log(`Loaded ${this.adminEmails.length} admin emails from configuration`);
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Debug logging
    this.logger.debug(`Admin access check - User: ${JSON.stringify(user)}`);
    this.logger.debug(`Admin emails configured: ${this.adminEmails.length} emails`);
    this.logger.debug(`Admin emails list: ${JSON.stringify(this.adminEmails)}`);

    if (!user) {
      this.logger.warn('Admin access denied: No user in request (JWT authentication may have failed)');
      throw new ForbiddenException('Admin access denied: Authentication required');
    }

    if (!user.email) {
      this.logger.warn('Admin access denied: No email in user object', { user });
      throw new ForbiddenException('Admin access denied: User email not found');
    }

    const userEmail = user.email.toLowerCase().trim();
    const isAdmin = this.adminEmails.includes(userEmail);

    if (!isAdmin) {
      this.logger.warn(`Admin access denied for user: ${user.email} (normalized: ${userEmail})`);
      this.logger.warn(`Configured admin emails: ${JSON.stringify(this.adminEmails)}`);
      throw new ForbiddenException(`Admin access denied: ${user.email} is not in admin list`);
    }

    this.logger.log(`Admin access granted for user: ${user.email}`);
    return true;
  }
}
