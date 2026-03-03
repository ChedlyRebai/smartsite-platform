import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express'; // ← Utiliser 'import type'

@Controller('auth')
export class GoogleController {
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    try {
      console.log('Google callback user:', req.user);
      
      // Si l'utilisateur n'est pas trouvé
      if (req.user?.error === 'USER_NOT_FOUND') {
        return res.redirect(
          `http://localhost:5173/register?email=${req.user.email}&firstName=${req.user.firstName}&lastName=${req.user.lastName}&error=no_account&google=true`,
        );
      }

      // Si le compte est en attente d'approbation
      if (req.user?.status === 'pending') {
        return res.redirect(
          `http://localhost:5173/login?error=pending_approval`,
        );
      }

      // Si l'utilisateur existe et est approuvé
      if (req.user?.access_token) {
        const { access_token, user } = req.user;
        const userStr = encodeURIComponent(JSON.stringify(user));
        return res.redirect(
          `http://localhost:5173/google-callback?token=${access_token}&user=${userStr}`,
        );
      }

      // Erreur générique
      return res.redirect(`http://localhost:5173/login?error=google_auth_failed`);
    } catch (error) {
      console.error('Google callback error:', error);
      return res.redirect(`http://localhost:5173/login?error=google_auth_failed`);
    }
  }
}