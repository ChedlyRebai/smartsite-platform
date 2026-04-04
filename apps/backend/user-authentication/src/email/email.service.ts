import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Attachment } from 'nodemailer/lib/mailer';
import * as fs from 'fs';
import * as path from 'path';

function normalizeGmailAppPassword(raw: string): string {
  return raw.replace(/\s+/g, '');
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Charte SmartSite : bleu marine, vert lime, cyan (lisible sur fond clair pour les clients mail) */
const BRAND = {
  navy: '#0c1929',
  navyMid: '#1e3a5f',
  lime: '#84cc16',
  limeDark: '#65a30d',
  cyan: '#22d3ee',
  bgPage: '#e8eef4',
  card: '#ffffff',
  text: '#1e293b',
  muted: '#64748b',
  border: '#cbd5e1',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor() {
    const emailUser = (process.env.EMAIL_USER || '').trim();
    const emailPasswordRaw =
      process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || '';
    const emailPassword = normalizeGmailAppPassword(emailPasswordRaw);

    this.fromAddress =
      process.env.EMAIL_FROM?.trim() ||
      (emailUser ? `"SmartSite" <${emailUser}>` : 'noreply@smartsite.local');

    if (emailUser && emailPassword) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });
      this.logger.log(
        `Transport SMTP configuré (smtp.gmail.com:587) pour ${emailUser}`,
      );
    } else {
      this.logger.warn(
        'EMAIL_USER ou EMAIL_PASSWORD manquant — les envois réels échoueront. Définissez un mot de passe d’application Google (16 caractères, sans espaces).',
      );
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: '', pass: '' },
      });
    }
  }

  private getLoginUrl(): string {
    return (
      process.env.FRONTEND_LOGIN_URL?.trim() ||
      process.env.APP_PUBLIC_URL?.trim() ||
      'http://localhost:5173/login'
    );
  }

  /** Logo : URL publique (prioritaire) ou fichier assets/email/smart-site-logo.png (CID) */
  private getLogoImgTag(): { html: string; attachments?: Attachment[] } {
    const publicUrl = process.env.EMAIL_LOGO_URL?.trim();
    if (publicUrl) {
      return {
        html: `<img src="${escapeHtml(publicUrl)}" alt="SmartSite" width="220" style="display:block;margin:0 auto 8px;max-width:100%;height:auto;border:0;" />`,
      };
    }

    const fromDist = path.join(__dirname, 'assets', 'smart-site-logo.png');
    const fromSrc = path.join(
      process.cwd(),
      'src',
      'email',
      'assets',
      'smart-site-logo.png',
    );
    const logoPath = fs.existsSync(fromDist) ? fromDist : fromSrc;
    if (!fs.existsSync(logoPath)) {
      this.logger.warn(
        `Logo email absent (dist: ${fromDist} | dev: ${fromSrc}). Définissez EMAIL_LOGO_URL ou ajoutez le fichier.`,
      );
      return {
        html: `<div style="text-align:center;margin-bottom:16px;font-family:Arial,sans-serif;">
          <span style="font-size:28px;font-weight:800;color:${BRAND.navy};">Smart</span><span style="font-size:28px;font-weight:800;color:${BRAND.lime};">Site</span>
          <div style="font-size:10px;letter-spacing:0.2em;color:${BRAND.navyMid};margin-top:4px;">INTELLIGENT CONSTRUCTION PLATFORM</div>
        </div>`,
      };
    }

    return {
      html: `<img src="cid:smartsite-logo" alt="SmartSite" width="240" style="display:block;margin:0 auto 8px;max-width:100%;height:auto;border:0;" />`,
      attachments: [
        {
          filename: 'smart-site-logo.png',
          path: logoPath,
          cid: 'smartsite-logo',
        },
      ],
    };
  }

  private wrapLayout(innerHtml: string, accent: 'lime' | 'cyan' | 'danger'): string {
    const accentColor =
      accent === 'danger' ? BRAND.danger : accent === 'cyan' ? BRAND.cyan : BRAND.lime;
    const { html: logoHtml } = this.getLogoImgTag();

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartSite</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bgPage};font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${BRAND.bgPage};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background-color:${BRAND.card};border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(12,25,41,0.08);">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,${BRAND.cyan},${BRAND.lime},${BRAND.navyMid});"></td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;text-align:center;">
              ${logoHtml}
              <div style="font-size:11px;letter-spacing:0.18em;color:${BRAND.navyMid};font-weight:600;margin-bottom:20px;">INTELLIGENT CONSTRUCTION PLATFORM</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;color:${BRAND.text};font-size:15px;line-height:1.55;">
              <div style="border-left:3px solid ${accentColor};padding-left:14px;margin-bottom:20px;">
                ${innerHtml}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:${BRAND.navy};color:#94a3b8;font-size:12px;line-height:1.5;text-align:center;">
              <p style="margin:0 0 8px;color:#e2e8f0;font-weight:600;">SmartSite</p>
              <p style="margin:0;">Plateforme intelligente pour le suivi de chantiers et la gestion de projets.</p>
              <p style="margin:12px 0 0;font-size:11px;color:#64748b;">Cet email a été envoyé automatiquement, merci de ne pas répondre directement si vous n’êtes pas sûr du destinataire.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  async sendApprovalEmail(
    userEmail: string,
    firstName: string,
    lastName: string,
    cin: string,
    password: string,
  ): Promise<void> {
    this.logger.log(`Envoi email d'approbation à ${userEmail}`);

    const subject = 'Votre compte SmartSite a été approuvé';
    const loginUrl = this.getLoginUrl();
    const inner = `
      <h1 style="margin:0 0 12px;font-size:22px;color:${BRAND.navy};font-weight:700;">Compte approuvé</h1>
      <p style="margin:0 0 16px;color:${BRAND.text};">Bonjour <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,</p>
      <p style="margin:0 0 20px;color:${BRAND.muted};">Votre inscription a été validée. Vous pouvez vous connecter à la plateforme avec les identifiants ci-dessous.</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid ${BRAND.border};margin-bottom:20px;">
        <tr style="background:${BRAND.navy};">
          <td colspan="2" style="padding:12px 16px;color:#fff;font-size:13px;font-weight:600;">Vos accès</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};width:36%;font-size:13px;">CIN</td>
          <td style="padding:12px 16px;border-bottom:1px solid ${BRAND.border};font-family:Consolas,monospace;font-size:14px;font-weight:600;">${escapeHtml(cin)}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};font-size:13px;">Mot de passe</td>
          <td style="padding:12px 16px;border-bottom:1px solid ${BRAND.border};font-family:Consolas,monospace;font-size:14px;font-weight:600;color:${BRAND.limeDark};">${escapeHtml(password)}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;color:${BRAND.muted};font-size:13px;vertical-align:middle;">Connexion</td>
          <td style="padding:12px 16px;">
            <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:${BRAND.lime};color:${BRAND.navy};text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:700;font-size:14px;">Ouvrir la plateforme</a>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 8px;font-size:13px;color:${BRAND.muted};"><strong>Sécurité :</strong> changez ce mot de passe après votre première connexion et ne partagez pas vos identifiants.</p>
      <p style="margin:16px 0 0;font-size:14px;color:${BRAND.text};">Cordialement,<br/><span style="color:${BRAND.navyMid};font-weight:600;">L’équipe SmartSite</span></p>
    `;

    const { attachments } = this.getLogoImgTag();
    await this.sendMail(
      userEmail,
      subject,
      this.wrapLayout(inner, 'lime'),
      attachments,
    );
  }

  async sendRejectionEmail(
    userEmail: string,
    firstName: string,
    lastName: string,
    cin: string,
    reason: string,
  ): Promise<void> {
    this.logger.log(`Envoi email de rejet à ${userEmail}`);

    const subject = 'Votre demande de compte SmartSite';
    const safeReason = escapeHtml(reason);
    const inner = `
      <h1 style="margin:0 0 12px;font-size:22px;color:${BRAND.navy};font-weight:700;">Mise à jour de votre demande</h1>
      <p style="margin:0 0 16px;color:${BRAND.text};">Bonjour <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,</p>
      <p style="margin:0 0 20px;color:${BRAND.muted};">Après examen, votre demande de compte sur SmartSite n’a pas pu être acceptée pour le moment.</p>

      <div style="background:${BRAND.dangerBg};border-radius:8px;padding:16px 18px;margin-bottom:20px;border:1px solid #fecaca;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:${BRAND.danger};text-transform:uppercase;letter-spacing:0.05em;">Motif</p>
        <p style="margin:0;color:${BRAND.text};font-size:14px;line-height:1.5;white-space:pre-wrap;">${safeReason}</p>
      </div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid ${BRAND.border};border-radius:8px;margin-bottom:20px;font-size:13px;">
        <tr>
          <td style="padding:10px 14px;color:${BRAND.muted};border-bottom:1px solid ${BRAND.border};">CIN</td>
          <td style="padding:10px 14px;border-bottom:1px solid ${BRAND.border};font-family:monospace;">${escapeHtml(cin)}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:${BRAND.muted};">Email</td>
          <td style="padding:10px 14px;">${escapeHtml(userEmail)}</td>
        </tr>
      </table>

      <p style="margin:0 0 16px;color:${BRAND.muted};font-size:14px;">Si vous pensez qu’il s’agit d’une erreur, contactez l’administration. Vous pourrez soumettre une nouvelle demande une fois les points mentionnés corrigés.</p>
      <p style="margin:16px 0 0;font-size:14px;color:${BRAND.text};">Cordialement,<br/><span style="color:${BRAND.navyMid};font-weight:600;">L’équipe SmartSite</span></p>
    `;

    const { attachments } = this.getLogoImgTag();
    await this.sendMail(
      userEmail,
      subject,
      this.wrapLayout(inner, 'danger'),
      attachments,
    );
  }

  async sendOTPEmail(
    email: string,
    firstName: string,
    otp: string,
  ): Promise<void> {
    this.logger.log(`Envoi OTP à ${email}`);

    const subject = 'Votre code de vérification SmartSite';
    const inner = `
      <h1 style="margin:0 0 12px;font-size:22px;color:${BRAND.navy};font-weight:700;">Vérification</h1>
      <p style="margin:0 0 20px;color:${BRAND.text};">Bonjour <strong>${escapeHtml(firstName)}</strong>,</p>
      <p style="margin:0 0 16px;color:${BRAND.muted};">Utilisez le code ci-dessous sur la plateforme SmartSite :</p>

      <div style="text-align:center;margin:24px 0;padding:24px;background:linear-gradient(135deg,${BRAND.navy} 0%,${BRAND.navyMid} 100%);border-radius:12px;border:2px solid ${BRAND.cyan};">
        <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:${BRAND.lime};font-family:Consolas,monospace;">${escapeHtml(otp)}</span>
      </div>

      <p style="margin:0;font-size:13px;color:${BRAND.danger};font-weight:600;">Ce code expire dans 10 minutes.</p>
      <p style="margin:16px 0 0;font-size:13px;color:${BRAND.muted};">Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.</p>
      <p style="margin:20px 0 0;font-size:14px;color:${BRAND.text};">Cordialement,<br/><span style="color:${BRAND.navyMid};font-weight:600;">L’équipe SmartSite</span></p>
    `;

    const { attachments } = this.getLogoImgTag();
    await this.sendMail(
      email,
      subject,
      this.wrapLayout(inner, 'cyan'),
      attachments,
    );
  }

  async sendTemporaryPasswordEmail(
    email: string,
    firstName: string,
    lastName: string,
    cin: string,
    temporaryPassword: string,
  ): Promise<void> {
    this.logger.log(`Envoi mot de passe temporaire à ${email}`);

    const subject = 'Votre compte SmartSite a été créé';
    const loginUrl = this.getLoginUrl();
    const inner = `
      <h1 style="margin:0 0 12px;font-size:22px;color:${BRAND.navy};font-weight:700;">Bienvenue</h1>
      <p style="margin:0 0 16px;color:${BRAND.text};">Bonjour <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,</p>
      <p style="margin:0 0 20px;color:${BRAND.muted};">Un compte a été créé pour vous. Connectez-vous avec le mot de passe temporaire ci-dessous.</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid ${BRAND.border};margin-bottom:20px;">
        <tr style="background:${BRAND.navyMid};">
          <td colspan="2" style="padding:12px 16px;color:#fff;font-size:13px;font-weight:600;">Identifiants</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};width:40%;">CIN</td>
          <td style="padding:12px 16px;border-bottom:1px solid ${BRAND.border};font-family:monospace;font-weight:600;">${escapeHtml(cin)}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};">Mot de passe temporaire</td>
          <td style="padding:12px 16px;border-bottom:1px solid ${BRAND.border};font-family:monospace;font-weight:600;color:${BRAND.limeDark};">${escapeHtml(temporaryPassword)}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;color:${BRAND.muted};">Connexion</td>
          <td style="padding:12px 16px;">
            <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:${BRAND.lime};color:${BRAND.navy};text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:700;font-size:14px;">Se connecter</a>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-size:13px;color:${BRAND.muted};">Pensez à modifier votre mot de passe après la première connexion.</p>
      <p style="margin:16px 0 0;font-size:14px;color:${BRAND.text};">Cordialement,<br/><span style="color:${BRAND.navyMid};font-weight:600;">L’équipe SmartSite</span></p>
    `;

    const { attachments } = this.getLogoImgTag();
    await this.sendMail(
      email,
      subject,
      this.wrapLayout(inner, 'lime'),
      attachments,
    );
  }

  private async sendMail(
    to: string,
    subject: string,
    html: string,
    extraAttachments?: Attachment[],
  ): Promise<void> {
    const user = (process.env.EMAIL_USER || '').trim();
    const pass = normalizeGmailAppPassword(
      process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || '',
    );
    if (!user || !pass) {
      const err =
        'SMTP non configuré : définissez EMAIL_USER et EMAIL_PASSWORD (mot de passe d’application Google, sans espaces) dans .env';
      this.logger.error(err);
      throw new Error(err);
    }

    const attachments = [...(extraAttachments || [])];

    try {
      const result = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
        attachments: attachments.length ? attachments : undefined,
      });
      this.logger.log(`Email envoyé à ${to}, messageId=${result.messageId}`);
    } catch (error) {
      this.logger.error(`Échec envoi email à ${to}`, error as Error);
      throw error;
    }
  }
}
