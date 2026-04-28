import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

export class QRGeneratorUtil {
  static async generateAndSaveQRCode(
    data: any,
    code: string,
  ): Promise<{ filePath: string; url: string; dataURL: string }> {
    try {
      const uploadDir = process.env.UPLOAD_PATH || './uploads/qrcodes';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `qr-${code}-${Date.now()}.png`;
      const filePath = path.join(uploadDir, fileName);

      const qrData = JSON.stringify({
        id: data.id || '',
        code: data.code,
        name: data.name,
        type: 'material',
      });

      const dataURL = await QRCode.toDataURL(qrData);

      await QRCode.toFile(filePath, qrData, {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      const url = `/uploads/qrcodes/${fileName}`;
      return { filePath, url, dataURL };
    } catch (error) {
      console.error('Erreur génération QR code:', error);
      throw new Error(`Impossible de générer le QR code: ${error.message}`);
    }
  }

  static async readQRCodeFromFile(filePath: string): Promise<string> {
    try {
      const { scanFromImage } = require('./qr-scanner.util');
      return await scanFromImage(filePath);
    } catch (error) {
      throw new Error(`Impossible de lire le QR code: ${error.message}`);
    }
  }
}
