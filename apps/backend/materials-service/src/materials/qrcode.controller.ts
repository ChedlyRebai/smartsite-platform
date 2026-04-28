import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { MaterialsService } from './materials.service';
import * as fs from 'fs';

@Controller('qrcodes')
export class QRCodeController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get(':materialId')
  async getQRCodeImage(@Param('materialId') id: string, @Res() res: Response) {
    try {
      const { imagePath, filename } =
        await this.materialsService.getQRCodeImage(id);

      // Définir les headers pour l'affichage
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

      // Envoyer le fichier
      const fileStream = fs.createReadStream(imagePath);
      fileStream.pipe(res);
    } catch (error) {
      throw new NotFoundException('Image QR code non trouvée');
    }
  }

  @Get('download/:materialId')
  async downloadQRCodeImage(
    @Param('materialId') id: string,
    @Res() res: Response,
  ) {
    try {
      const { imagePath, filename } =
        await this.materialsService.getQRCodeImage(id);

      // Définir les headers pour le téléchargement
      res.setHeader('Content-Type', 'image/png');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );

      // Envoyer le fichier
      const fileStream = fs.createReadStream(imagePath);
      fileStream.pipe(res);
    } catch (error) {
      throw new NotFoundException('Image QR code non trouvée');
    }
  }
}
