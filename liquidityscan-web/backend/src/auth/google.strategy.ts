import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3000/api/auth/google/callback';

    console.log('[GoogleStrategy] Initializing with:');
    console.log('  - Client ID:', clientID ? `${clientID.substring(0, 20)}...` : 'NOT SET');
    console.log('  - Client Secret:', clientSecret ? 'SET' : 'NOT SET');
    console.log('  - Callback URL:', callbackURL);

    if (!clientID || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
    }

    // Ensure callback URL is absolute
    if (!callbackURL.startsWith('http://') && !callbackURL.startsWith('https://')) {
      console.warn('[GoogleStrategy] Warning: callbackURL should be an absolute URL (e.g., http://localhost:3000/api/auth/google/callback)');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    console.log('[GoogleStrategy.validate] Called with profile:', {
      id: profile?.id,
      displayName: profile?.displayName,
      emailsCount: profile?.emails?.length || 0,
    });

    const { name, emails, photos } = profile;
    
    if (!emails || !emails[0] || !emails[0].value) {
      console.error('[GoogleStrategy.validate] Email not provided by Google');
      return done(new Error('Email not provided by Google'), undefined);
    }

    const userEmail = emails[0].value;
    console.log('[GoogleStrategy.validate] Email extracted:', userEmail);

    const user = {
      email: userEmail,
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      picture: photos?.[0]?.value || '',
      accessToken,
      refreshToken,
    };

    console.log('[GoogleStrategy.validate] User data prepared:', {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      hasPicture: !!user.picture,
    });

    done(null, user);
  }
}
