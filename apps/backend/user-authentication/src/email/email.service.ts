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
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'wzcnrlxs5my3lf5m@ethereal.email',
          pass: 'eyyBm8xBw1Ugz8rMFc',
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
}
