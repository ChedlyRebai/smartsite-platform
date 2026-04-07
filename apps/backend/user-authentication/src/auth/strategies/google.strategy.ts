import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {
    const clientID = configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get('GOOGLE_CLIENT_SECRET');
    
    if (!clientID || !clientSecret) {
      console.warn('⚠️ Google OAuth not configured - GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET missing');
      super({ clientID: 'dummy', clientSecret: 'dummy', callbackURL: 'http://localhost:3000/auth/google/callback', scope: ['email', 'profile'] });
    } else {
      super({
        clientID,
        clientSecret,
        callbackURL: 'http://localhost:3000/auth/google/callback',
        scope: ['email', 'profile'],
      });
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    try {
      const { name, emails } = profile;
      const email = emails[0].value;
      const firstName = name.givenName;
      const lastName = name.familyName;

      console.log('📧 Google profile reçu:', { email, firstName, lastName });

      // Chercher l'utilisateur par email
      const user = await this.usersService.findByEmail(email);

      // Si l'utilisateur n'existe pas
      if (!user) {
        console.log('❌ Utilisateur non trouvé pour email:', email);
        return { 
          error: 'USER_NOT_FOUND', 
          email,
          firstName,
          lastName,
        };
      }

      console.log('✅ Utilisateur trouvé:', { 
        id: user._id, 
        email: user.email,
        status: user.status,
        role: user.role 
      });

      // Vérifier le statut
      if (user.status !== 'approved') {
        console.log('⏳ Compte en attente d\'approbation');
        return { 
          id: user._id,
          email: user.email,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          status: user.status 
        };
      }

      // Utilisateur trouvé et approuvé - générer un token JWT
      const payload = {
        email: user.email,
        sub: user._id,
        role: user.role,
      };

      const token = this.jwtService.sign(payload);
      console.log('🔑 Token JWT généré pour:', user.email);

      return {
        access_token: token,
        user: {
          id: user._id,
          email: user.email,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          cin: user.cin,
          role: user.role,
        },
      };
    } catch (error) {
      console.error('❌ Google strategy error:', error);
      throw error;
    }
  }
}