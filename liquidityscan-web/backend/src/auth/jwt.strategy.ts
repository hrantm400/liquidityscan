import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    // Check if user is admin based on ADMIN_EMAILS env variable
    const adminEmailsEnv = this.configService.get<string>('ADMIN_EMAILS');
    const adminEmails = adminEmailsEnv
      ? adminEmailsEnv.split(',').map(e => e.trim().toLowerCase())
      : [];
    const isAdmin = adminEmails.includes(user.email.toLowerCase());

    return {
      ...user,
      isAdmin,
    };
  }
}
