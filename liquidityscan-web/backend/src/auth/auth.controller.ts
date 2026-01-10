import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    console.log('[Google OAuth Callback] ========================================');
    console.log('[Google OAuth Callback] Received callback from Google');
    
    try {
      // Check if user data exists
      if (!req.user) {
        console.error('[Google OAuth Callback] ERROR: req.user is undefined');
        console.error('[Google OAuth Callback] This means GoogleStrategy.validate() did not return user data');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const redirectUrl = `${frontendUrl}/app/login?error=${encodeURIComponent('no_user_data')}`;
        console.log('[Google OAuth Callback] Redirecting to:', redirectUrl);
        return res.redirect(redirectUrl);
      }

      console.log('[Google OAuth Callback] User data received from GoogleStrategy:', { 
        email: (req.user as any)?.email,
        firstName: (req.user as any)?.firstName,
        lastName: (req.user as any)?.lastName,
      });

      console.log('[Google OAuth Callback] Calling AuthService.googleLogin()...');
      const result = await this.authService.googleLogin(req.user);
      
      if (!result || !result.accessToken || !result.refreshToken) {
        console.error('[Google OAuth Callback] ERROR: Failed to generate tokens');
        console.error('[Google OAuth Callback] Result:', result);
        throw new Error('Failed to generate tokens');
      }

      console.log('[Google OAuth Callback] Tokens generated successfully');
      console.log('[Google OAuth Callback] User from DB:', {
        id: result.user?.id,
        email: result.user?.email,
        name: result.user?.name,
      });

      // Build redirect URL - redirect to static oauth-callback.html (processes tokens before React loads)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = `${frontendUrl}/oauth-callback.html?token=${encodeURIComponent(result.accessToken)}&refreshToken=${encodeURIComponent(result.refreshToken)}`;
      
      console.log('[Google OAuth Callback] Redirecting to:', frontendUrl + '/oauth-callback.html?token=***&refreshToken=***');
      console.log('[Google OAuth Callback] ========================================');
      res.redirect(redirectUrl);
    } catch (error: any) {
      console.error('[Google OAuth Callback] ========================================');
      console.error('[Google OAuth Callback] ERROR occurred:', error?.message || error);
      console.error('[Google OAuth Callback] Stack:', error?.stack);
      console.error('[Google OAuth Callback] ========================================');
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const errorMessage = error?.message || 'authentication_failed';
      const redirectUrl = `${frontendUrl}/app/login?error=${encodeURIComponent(errorMessage)}`;
      console.log('[Google OAuth Callback] Redirecting to error page:', redirectUrl);
      res.redirect(redirectUrl);
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request) {
    return this.authService.getProfile(req.user);
  }
}
