import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';

/**
 * Admin Decorator - combines JWT authentication with admin authorization
 * Use this decorator on any route that should only be accessible to admins
 * 
 * Example:
 * @Admin()
 * @Get('users')
 * async getAllUsers() { ... }
 */
export function Admin() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, AdminGuard)
  );
}
