import * as fs from 'fs';
import * as path from 'path';
const Jimp = require('jimp');
const jsQR = require('jsqr'); // ← Remplacer qrcode-reader par jsqr

export class QRScannerUtil {
  /**
   * Scanner un QR code depuis un fichier image
   * @param imagePath Chemin vers l'image
   * @returns Les données du QR code
   */
  static async scanFromImage(imagePath: string): Promise<string> {
    try {
      // Vérifier que le fichier existe
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Le fichier ${imagePath} n'existe pas`);
      }

      console.log(`🔍 Scan du QR code depuis: ${imagePath}`);

      // Lire l'image avec Jimp
      const imageBuffer = fs.readFileSync(imagePath);
      const image = await Jimp.read(imageBuffer);

      // Obtenir les dimensions et les données brutes
      const width = image.bitmap.width;
      const height = image.bitmap.height;
      const pixels = new Uint8ClampedArray(image.bitmap.data);

      console.log(`📐 Image: ${width}x${height}, ${pixels.length} pixels`);

      // Utiliser jsQR pour décoder
      const code = jsQR(pixels, width, height);

      if (!code) {
        throw new Error("Aucun QR code trouvé dans l'image");
      }

      console.log(`✅ QR code décodé: ${code.data.substring(0, 50)}...`);

      return code.data;
    } catch (error) {
      console.error('❌ Erreur détaillée:', error);
      throw new Error(`Erreur scan QR: ${error.message}`);
    }
  }

  /**
   * Scanner un QR code depuis un buffer
   * @param buffer Buffer de l'image
   * @returns Les données du QR code
   */
  static async scanFromBuffer(buffer: Buffer): Promise<string> {
    try {
      // Lire l'image depuis un buffer
      const image = await Jimp.read(buffer);

      // Obtenir les dimensions et les données brutes
      const width = image.bitmap.width;
      const height = image.bitmap.height;
      const pixels = new Uint8ClampedArray(image.bitmap.data);

      // Utiliser jsQR pour décoder
      const code = jsQR(pixels, width, height);

      if (!code) {
        throw new Error("Aucun QR code trouvé dans l'image");
      }

      return code.data;
    } catch (error) {
      throw new Error(`Erreur scan QR: ${error.message}`);
    }
  }

  /**
   * Parser les données du QR code
   * @param qrData Les données brutes du QR code
   * @returns Les données parsées (objet JSON ou texte)
   */
  static parseQRData(qrData: string): any {
    try {
      // Essayer de parser comme JSON
      return JSON.parse(qrData);
    } catch {
      // Si ce n'est pas du JSON, retourner comme texte
      return {
        code: qrData,
        raw: qrData,
        type: 'text',
      };
    }
  }

  /**
   * Valider si une chaîne est un QR code valide
   * @param qrData Les données du QR code
   * @returns true si valide
   */
  static isValidQR(qrData: string): boolean {
    return !!(qrData && qrData.length > 0);
  }

  /**
   * Extraire l'ID d'un QR code parsé
   * @param parsedData Les données parsées
   * @returns L'ID si présent, sinon null
   */
  static extractId(parsedData: any): string | null {
    if (!parsedData) return null;

    // Chercher l'ID dans différentes propriétés possibles
    if (parsedData.id) return parsedData.id;
    if (parsedData._id) return parsedData._id;
    if (parsedData.materialId) return parsedData.materialId;

    return null;
  }

  /**
   * Extraire le code d'un QR code parsé
   * @param parsedData Les données parsées
   * @returns Le code si présent, sinon null
   */
  static extractCode(parsedData: any): string | null {
    if (!parsedData) return null;

    // Chercher le code dans différentes propriétés possibles
    if (parsedData.code) return parsedData.code;
    if (parsedData.materialCode) return parsedData.materialCode;

    return null;
  }

  /**
   * Vérifier si les données parsées correspondent à un matériau
   * @param parsedData Les données parsées
   * @returns true si c'est un matériau
   */
  static isMaterial(parsedData: any): boolean {
    return !!(
      parsedData &&
      (parsedData.type === 'material' || parsedData.id || parsedData.code)
    );
  }
}
