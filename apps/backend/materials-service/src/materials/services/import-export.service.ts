import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Material } from '../entities/material.entity';
import { BulkImportMaterialDto, BulkImportResponse } from '../dto/bulk-import.dto';
import { QRGeneratorUtil } from '../../common/utils/qr-generator.util';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImportExportService {
  private readonly logger = new Logger(ImportExportService.name);

  constructor(
    @InjectModel(Material.name) private materialModel: Model<Material>,
  ) {}

  async importFromExcel(filePath: string): Promise<BulkImportResponse> {
    try {
      // Vérifier que le fichier existe
      if (!fs.existsSync(filePath)) {
        throw new Error(`Le fichier ${filePath} n'existe pas`);
      }

      this.logger.log(`📂 Lecture du fichier Excel: ${filePath}`);
      
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      this.logger.log(`📊 ${data.length} lignes trouvées dans le fichier`);
      
      const response: BulkImportResponse = {
        success: true,
        imported: 0,
        failed: 0,
        errors: [],
        materials: [],
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i] as any;
        const rowNumber = i + 2;
        
        try {
          this.logger.log(`🔄 Traitement ligne ${rowNumber}: ${row.code || 'N/A'}`);
          
          const materialData = this.validateRowData(row, rowNumber);
          const material = await this.createMaterialFromRow(materialData);
          response.imported++;
          response.materials.push(material);
          
          this.logger.log(`✅ Ligne ${rowNumber} importée avec succès: ${material.code}`);
        } catch (error) {
          this.logger.error(`❌ Erreur ligne ${rowNumber}: ${error.message}`);
          response.failed++;
          response.errors.push({
            row: rowNumber,
            code: row.code || 'N/A',
            error: error.message,
          });
        }
      }

      this.logger.log(`✅ Import terminé: ${response.imported} réussis, ${response.failed} échoués`);
      return response;
      
    } catch (error) {
      this.logger.error(`❌ Erreur import Excel: ${error.message}`);
      throw new BadRequestException(`Erreur lors de l'import: ${error.message}`);
    }
  }

  private validateRowData(row: any, rowNumber: number): BulkImportMaterialDto {
    // Normaliser les noms de colonnes
    const normalizeKey = (key: string): string => {
      const normalized = key.toLowerCase()
        .replace(/[éèêë]/g, 'e')
        .replace(/[àâä]/g, 'a')
        .replace(/[îï]/g, 'i')
        .replace(/[ôö]/g, 'o')
        .replace(/[ùûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');
      return normalized;
    };

    // Créer un objet normalisé
    const normalizedRow: any = {};
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = normalizeKey(key);
      normalizedRow[normalizedKey] = value;
    }

    // Mapper les clés normalisées aux champs attendus
    const getValue = (possibleKeys: string[]): any => {
      for (const key of possibleKeys) {
        if (normalizedRow[key] !== undefined && normalizedRow[key] !== null && normalizedRow[key] !== '') {
          return normalizedRow[key];
        }
      }
      return undefined;
    };

    const code = getValue(['code', 'codemateriau', 'reference', 'ref']) || row.code;
    const name = getValue(['nom', 'name', 'designation', 'libelle']) || row.name;
    const category = getValue(['categorie', 'category', 'cat']) || row.category;
    const unit = getValue(['unite', 'unit', 'unitemesure']) || row.unit;
    const quantity = getValue(['quantite', 'quantity', 'qte', 'stock']) || row.quantity;
    const minimumStock = getValue(['stockminimum', 'minimumstock', 'stockmin', 'minstock']) || row.minimumStock;
    const maximumStock = getValue(['stockmaximum', 'maximumstock', 'stockmax', 'maxstock']) || row.maximumStock;
    const stockMinimum = getValue(['pointdecommande', 'reorderpoint', 'seuil', 'reorder', 'stockminimum']) || row.stockMinimum;
    const expiryDate = getValue(['dateexpiration', 'expirydate', 'expiration', 'peremption']) || row.expiryDate;
    const qualityGrade = getValue(['qualite', 'qualitygrade', 'quality']) || row.qualityGrade;

    if (!code) throw new Error('Code manquant');
    if (!name) throw new Error('Nom manquant');
    if (!category) throw new Error('Catégorie manquante');
    if (!unit) throw new Error('Unité manquante');
    
    const quantityNum = Number(quantity) || 0;
    const minimumStockNum = Number(minimumStock) || 0;
    const maximumStockNum = Number(maximumStock) || 0;
    const stockMinimumNum = Number(stockMinimum) || minimumStockNum;
    
    if (minimumStockNum >= maximumStockNum && maximumStockNum > 0) {
      throw new Error('Stock minimum doit être inférieur au stock maximum');
    }
    
    if (stockMinimumNum < minimumStockNum || stockMinimumNum > maximumStockNum) {
      if (minimumStockNum > 0 && maximumStockNum > 0) {
        throw new Error('Point de commande doit être entre stock min et max');
      }
    }
    
    let qualityGradeNum: number | undefined;
    if (qualityGrade) {
      qualityGradeNum = Number(qualityGrade);
      if (qualityGradeNum < 0 || qualityGradeNum > 1) {
        throw new Error('Qualité doit être entre 0 et 1');
      }
    }
    
    let expiryDateStr: string | undefined;
    if (expiryDate && expiryDate !== 'N/A' && expiryDate !== '') {
      try {
        let date: Date;
        if (typeof expiryDate === 'number') {
          date = new Date(Math.round((expiryDate - 25569) * 86400 * 1000));
        } else {
          date = new Date(expiryDate);
        }
        
        if (!isNaN(date.getTime())) {
          expiryDateStr = date.toISOString();
        }
      } catch {
        // Ignorer les dates invalides
      }
    }
    
    return {
      name: String(name),
      code: String(code),
      category: String(category),
      unit: String(unit),
      quantity: quantityNum,
      minimumStock: minimumStockNum,
      maximumStock: maximumStockNum,
      stockMinimum: stockMinimumNum,
      qualityGrade: qualityGradeNum,
      expiryDate: expiryDateStr,
      specifications: row.specifications ? JSON.parse(row.specifications) : undefined,
    };
  }

  private async createMaterialFromRow(rowData: BulkImportMaterialDto): Promise<Material> {
    const existing = await this.materialModel.findOne({ code: rowData.code });
    if (existing) {
      throw new Error(`Le code ${rowData.code} existe déjà`);
    }
    
    const tempId = new Types.ObjectId();
    const qrResult = await QRGeneratorUtil.generateAndSaveQRCode(
      {
        id: tempId,
        code: rowData.code,
        name: rowData.name,
      },
      rowData.code
    );
    
    const barcode = `MAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    let specifications = {};
    if (rowData.specifications) {
      try {
        specifications = typeof rowData.specifications === 'string' 
          ? JSON.parse(rowData.specifications) 
          : rowData.specifications;
      } catch {
        specifications = {};
      }
    }
    
    const materialData: any = {
      ...rowData,
      _id: tempId,
      qrCode: qrResult.dataURL,
      qrCodeImage: qrResult.url,
      barcode,
      priceHistory: { [new Date().toISOString().replace(/\./g, '-')]: 0 },
      status: 'active',
      specifications,
    };
    
    const material = new this.materialModel(materialData);
    return await material.save();
  }

  async exportToExcel(materialIds?: string[]): Promise<{ filePath: string; filename: string }> {
    try {
      let materials: Material[];
      if (materialIds && materialIds.length > 0) {
        materials = await this.materialModel.find({ _id: { $in: materialIds } }).exec();
      } else {
        materials = await this.materialModel.find().exec();
      }
      
      const data = materials.map(m => ({
        Code: m.code,
        Nom: m.name,
        Catégorie: m.category,
        Unité: m.unit,
        Quantité: m.quantity,
        'Stock Minimum': m.minimumStock,
        'Stock Maximum': m.maximumStock,
        'Stock Minimum Requis': m.stockMinimum,
        Qualité: m.qualityGrade || '',
        'Date expiration': m.expiryDate ? new Date(m.expiryDate).toLocaleDateString('fr-FR') : '',
        Statut: m.status,
        'Quantité réservée': m.reservedQuantity || 0,
        'Quantité endommagée': m.damagedQuantity || 0,
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Matériaux');
      
      const exportDir = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      const filename = `materiaux_${Date.now()}.xlsx`;
      const filePath = path.join(exportDir, filename);
      XLSX.writeFile(workbook, filePath);
      
      this.logger.log(`✅ Export Excel créé: ${filePath}`);
      
      // Lire le fichier et le retourner comme buffer
      const fileBuffer = fs.readFileSync(filePath);
      
      // Retourner à la fois le chemin et le buffer
      return { 
        filePath, 
        filename,
        buffer: fileBuffer 
      } as any;
      
    } catch (error) {
      this.logger.error(`❌ Erreur export Excel: ${error.message}`);
      throw new BadRequestException(`Erreur lors de l'export: ${error.message}`);
    }
  }

  async exportToPDF(materialIds?: string[]): Promise<{ filePath: string; filename: string }> {
    try {
      let materials: Material[];
      if (materialIds && materialIds.length > 0) {
        materials = await this.materialModel.find({ _id: { $in: materialIds } }).exec();
      } else {
        materials = await this.materialModel.find().exec();
      }
      
      if (!materials.length) {
        throw new Error('Aucun matériau à exporter');
      }
      
      const exportDir = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      const filename = `inventaire_${Date.now()}.pdf`;
      const filePath = path.join(exportDir, filename);
      
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      
      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          this.logger.log(`✅ Export PDF créé: ${filePath}`);
          // Lire le fichier et le retourner comme buffer
          const fileBuffer = fs.readFileSync(filePath);
          resolve({ 
            filePath, 
            filename,
            buffer: fileBuffer 
          } as any);
        });
        
        stream.on('error', (error) => {
          this.logger.error(`❌ Erreur écriture PDF: ${error.message}`);
          reject(new BadRequestException(`Erreur lors de l'export PDF: ${error.message}`));
        });
        
        doc.pipe(stream);
        
        doc.fontSize(20).text('Inventaire des matériaux', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
        doc.moveDown();
        doc.fontSize(10).text(`Total: ${materials.length} matériaux`, { align: 'left' });
        doc.moveDown();
        
        const tableTop = 150;
        const itemHeight = 20;
        let y = tableTop;
        
        doc.font('Helvetica-Bold');
        doc.text('Code', 50, y);
        doc.text('Nom', 120, y);
        doc.text('Catégorie', 250, y);
        doc.text('Quantité', 350, y);
        doc.text('Statut', 420, y);
        doc.text('Emplacement', 480, y);
        
        y += itemHeight;
        doc.font('Helvetica');
        
        for (const material of materials) {
          if (y > 750) {
            doc.addPage();
            y = 50;
            doc.font('Helvetica-Bold');
            doc.text('Code', 50, y);
            doc.text('Nom', 120, y);
            doc.text('Catégorie', 250, y);
            doc.text('Quantité', 350, y);
            doc.text('Statut', 420, y);
            doc.text('Emplacement', 480, y);
            y += itemHeight;
            doc.font('Helvetica');
          }
          
          let status = 'En stock';
          let statusColor = '#28a745';
          
          if (material.quantity === 0) {
            status = 'Rupture';
            statusColor = '#dc3545';
          } else if (material.quantity <= material.stockMinimum) {
            status = 'Stock bas';
            statusColor = '#ffc107';
          } else if (material.expiryDate && new Date(material.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
            status = 'Expire bientôt';
            statusColor = '#fd7e14';
          }
          
          doc.text(material.code.substring(0, 15), 50, y);
          doc.text(material.name.substring(0, 20), 120, y);
          doc.text(material.category.substring(0, 15), 250, y);
          doc.text(material.quantity.toString() + ' ' + material.unit, 350, y);
          
          doc.fillColor(statusColor).text(status, 420, y);
          doc.fillColor('black');
          
          y += itemHeight;
        }
        
        doc.end();
      });
      
    } catch (error) {
      this.logger.error(`❌ Erreur export PDF: ${error.message}`);
      throw new BadRequestException(`Erreur lors de l'export PDF: ${error.message}`);
    }
  }
}