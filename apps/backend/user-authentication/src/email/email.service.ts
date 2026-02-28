import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Email configuration
    // For development, uses Ethereal test email service (no actual email sent)
    // For production, set EMAIL_USER and EMAIL_PASSWORD environment variables
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (emailUser && emailPassword) {
      // Production: Use Gmail or other SMTP service
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });
    } else {
      // Development: Use Ethereal test account with valid credentials
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'chedly.rebai123@gmail.com',
          pass: process.env.EMAIL_PASS,
        },
      });
    }
  }

  async sendApprovalEmail(
    userEmail: string,
    firstName: string,
    lastName: string,
    cin: string,
    password: string,
  ): Promise<void> {
    console.log('📧 EMAIL SERVICE: Début envoi email à', userEmail);
    console.log('📧 EMAIL SERVICE: Utilisateur', firstName, lastName);
    
    const subject = 'Votre compte SmartSite a été approuvé';
    const htmlContent = `
      <h2>Bienvenue sur SmartSite</h2>
      <p>Bonjour ${firstName} ${lastName},</p>
      <p>Votre compte a été approuvé avec succès. Vous pouvez maintenant accéder à la plateforme.</p>
      
      <h3>Vos informations d'accès:</h3>
      <table style="border-collapse: collapse; border: 1px solid #ddd;">
        <tr style="background-color: #f2f2f2;">
          <td style="border: 1px solid #ddd; padding: 12px;"><strong>CIN:</strong></td>
          <td style="border: 1px solid #ddd; padding: 12px;"><code>${cin}</code></td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px;"><strong>Mot de passe:</strong></td>
          <td style="border: 1px solid #ddd; padding: 12px;"><code>${password}</code></td>
        </tr>
        <tr style="background-color: #f2f2f2;">
          <td style="border: 1px solid #ddd; padding: 12px;"><strong>URL d'accès:</strong></td>
          <td style="border: 1px solid #ddd; padding: 12px;"><a href="http://localhost:5173/login">http://localhost:5173/login</a></td>
        </tr>
      </table>

      <h3>Recommandations de sécurité:</h3>
      <ul>
        <li>Gardez votre CIN et votre mot de passe en lieu sûr</li>
        <li>Ne partagez pas vos identifiants avec d'autres personnes</li>
        <li>Changez votre mot de passe dès votre première connexion</li>
      </ul>

      <p>Si vous avez des questions ou besoin d'assistance, veuillez contacter l'équipe d'administration.</p>
      <p>Cordialement,<br/>L'équipe SmartSite</p>
    `;

    try {
      console.log('📧 EMAIL SERVICE: Préparation envoi...');
      const result = await this.transporter.sendMail({
        from: process.env.EMAIL_USER || 'noreply@smartsite.com',
        to: userEmail,
        subject,
        html: htmlContent,
      });

      console.log('✅ EMAIL SERVICE: Email envoyé avec succès !');
      console.log('📧 EMAIL SERVICE: Message ID:', result.messageId);

      // Log preview URL for development
      if (!process.env.EMAIL_USER) {
        console.log('\n📧 EMAIL SENT - Preview URL:', nodemailer.getTestMessageUrl(result));
        console.log('📧 You can view the email at the URL above.\n');
      } else {
        console.log('📧 EMAIL SERVICE: Email envoyé via Gmail à', userEmail);
      }
    } catch (error) {
      console.error('❌ EMAIL SERVICE: Erreur envoi email:', error);
      throw error;
    }
  }

  async sendOTPEmail(
    userEmail: string,
    firstName: string,
    otp: string,
  ): Promise<void> {
    console.log('📧 EMAIL SERVICE: Envoi OTP à', userEmail);
    
    const subject = 'Code de vérification SmartSite';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Vérification de votre email</h2>
        <p>Bonjour ${firstName},</p>
        <p>Merci de vous être inscrit sur SmartSite. Pour finaliser votre inscription, veuillez utiliser le code de vérification ci-dessous:</p>
        
        <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <h1 style="color: #4F46E5; font-size: 48px; margin: 0; letter-spacing: 8px;">${otp}</h1>
        </div>

        <p style="color: #6B7280;">Ce code est valide pendant <strong>10 minutes</strong>.</p>
        
        <p style="margin-top: 30px;">Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.</p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        <p style="color: #9CA3AF; font-size: 12px;">
          Ceci est un email automatique, merci de ne pas y répondre.<br>
          © ${new Date().getFullYear()} SmartSite. Tous droits réservés.
        </p>
      </div>
    `;

    try {
      const result = await this.transporter.sendMail({
        from: process.env.EMAIL_USER || 'noreply@smartsite.com',
        to: userEmail,
        subject,
        html: htmlContent,
      });

      console.log('✅ EMAIL SERVICE: OTP envoyé avec succès !');
      
      if (!process.env.EMAIL_USER) {
        console.log('\n📧 OTP EMAIL - Preview URL:', nodemailer.getTestMessageUrl(result));
        console.log('📧 You can view the email at the URL above.\n');
      }
    } catch (error) {
      console.error('❌ EMAIL SERVICE: Erreur envoi OTP:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(
    userEmail: string,
    firstName: string,
    resetCode: string,
  ): Promise<void> {
    console.log('📧 EMAIL SERVICE: Envoi code réinitialisation à', userEmail);
    
    const subject = 'Réinitialisez votre mot de passe SmartSite';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Réinitialisation de mot de passe</h2>
        <p>Bonjour ${firstName},</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe SmartSite. Veuillez utiliser le code ci-dessous pour procéder:</p>
        
        <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <h1 style="color: #4F46E5; font-size: 48px; margin: 0; letter-spacing: 8px;">${resetCode}</h1>
        </div>

        <p style="color: #6B7280;">Ce code est valide pendant <strong>15 minutes</strong>.</p>
        
        <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #92400E; margin: 0;"><strong>Attention :</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre compte restera sécurisé.</p>
        </div>

        <p style="margin-top: 30px; color: #6B7280;">Après avoir réinitialisé votre mot de passe, nous vous recommandons de changer votre mot de passe dans les paramètres de votre compte.</p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        <p style="color: #9CA3AF; font-size: 12px;">
          Ceci est un email automatique, merci de ne pas y répondre.<br>
          © ${new Date().getFullYear()} SmartSite. Tous droits réservés.
        </p>
      </div>
    `;

    try {
      const result = await this.transporter.sendMail({
        from: process.env.EMAIL_USER || 'noreply@smartsite.com',
        to: userEmail,
        subject,
        html: htmlContent,
      });

      console.log('✅ EMAIL SERVICE: Code réinitialisation envoyé avec succès !');
      
      if (!process.env.EMAIL_USER) {
        console.log('\n📧 PASSWORD RESET EMAIL - Preview URL:', nodemailer.getTestMessageUrl(result));
        console.log('📧 You can view the email at the URL above.\n');
      }
    } catch (error) {
      console.error('❌ EMAIL SERVICE: Erreur envoi code réinitialisation:', error);
      throw error;
    }
  }
}
