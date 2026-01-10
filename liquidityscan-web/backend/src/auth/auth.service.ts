import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Check if user is admin based on ADMIN_EMAILS env variable
    const adminEmailsEnv = this.configService.get<string>('ADMIN_EMAILS');
    const adminEmails = adminEmailsEnv
      ? adminEmailsEnv.split(',').map(e => e.trim().toLowerCase())
      : [];
    const isAdmin = adminEmails.includes(user.email.toLowerCase());

    return {
      user: {
        ...user,
        isAdmin,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Check if user is admin based on ADMIN_EMAILS env variable
    const adminEmailsEnv = this.configService.get<string>('ADMIN_EMAILS');
    const adminEmails = adminEmailsEnv
      ? adminEmailsEnv.split(',').map(e => e.trim().toLowerCase())
      : [];
    const isAdmin = adminEmails.includes(user.email.toLowerCase());

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      ...tokens,
    };
  }

  async googleLogin(googleUser: any) {
    if (!googleUser) {
      throw new UnauthorizedException('No user data from Google');
    }

    const { email, firstName, lastName, picture } = googleUser;

    if (!email) {
      throw new UnauthorizedException('Email not provided by Google');
    }

    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      // Create new user from Google
      user = await this.prisma.user.create({
        data: {
          email,
          name: `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
          passwordHash: '', // No password for OAuth users
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } else {
      // Update user info if needed
      const newName = user.name || `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0];
      if (user.name !== newName) {
        user = await this.prisma.user.update({
          where: { email },
          data: {
            name: newName,
          },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Check if user is admin based on ADMIN_EMAILS env variable
    const adminEmailsEnv = this.configService.get<string>('ADMIN_EMAILS');
    const adminEmails = adminEmailsEnv
      ? adminEmailsEnv.split(',').map(e => e.trim().toLowerCase())
      : [];
    const isAdmin = adminEmails.includes(user.email.toLowerCase());

    return {
      user: {
        ...user,
        isAdmin,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const tokens = await this.generateTokens(payload.sub, payload.email);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(user: any) {
    // user comes from JwtStrategy.validate() which already fetches from DB
    // But we need createdAt and updatedAt, so fetch again
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id || user.sub },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is admin based on ADMIN_EMAILS env variable
    const adminEmailsEnv = this.configService.get<string>('ADMIN_EMAILS');
    const adminEmails = adminEmailsEnv
      ? adminEmailsEnv.split(',').map(e => e.trim().toLowerCase())
      : [];
    const isAdmin = adminEmails.includes(dbUser.email.toLowerCase());

    return {
      ...dbUser,
      isAdmin,
    };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '1h', // Увеличено с 15m до 1h
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '30d', // Увеличено с 7d до 30d
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
