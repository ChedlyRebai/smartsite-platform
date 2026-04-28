import {
  Controller,
  Post,
  Get,
  Param,
  Put,
  Delete,
  Body,
  Query,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { SuppliersService } from './suppliers.service';
import { MLService } from '../ml/ml.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function createStorage(destination: string) {
  return diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = join(process.cwd(), 'uploads', destination);
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
    },
  });
}

@Controller('suppliers')
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
    private readonly mlService: MLService,
  ) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'contract', maxCount: 1 },
        { name: 'insuranceDocument', maxCount: 1 },
      ],
      {
        storage: createStorage('documents'),
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: (req, file, cb) => {
          if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(
              new BadRequestException(
                'Only PDF, JPG, and PNG files are allowed (max 5MB)',
              ),
              false,
            );
          }
        },
      },
    ),
  )
  async create(
    @Body() dto: CreateSupplierDto,
    @UploadedFiles()
    files: {
      contract?: Express.Multer.File[];
      insuranceDocument?: Express.Multer.File[];
    },
  ) {
    const contractFile = files?.contract?.[0];
    const insuranceDocumentFile = files?.insuranceDocument?.[0];

    return this.suppliersService.create(dto, contractFile, insuranceDocumentFile);
  }

  @Get()
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get('pending-qhse')
  findPendingQhse() {
    return this.suppliersService.findPendingQhse();
  }

  @Get(':id/delay-prediction')
  async getDelayPrediction(
    @Param('id') id: string,
    @Query('amount') amount?: string,
    @Query('days') days?: string,
    @Query('month') month?: string,
  ) {
    try {
      const supplier = await this.suppliersService.findById(id);
      const prediction = await this.mlService.predictDelay({
        supplierId: id,
        amount: amount ? parseFloat(amount) : 10000,
        days: days ? parseInt(days, 10) : 5,
        month: month ? parseInt(month, 10) : new Date().getMonth() + 1,
        supplierRating: supplier.averageRating || 0,
      });
      return {
        supplierId: id,
        supplierName: supplier.name,
        averageRating: supplier.averageRating || 0,
        ...prediction,
      };
    } catch (error) {
      return {
        supplierId: id,
        error: 'Unable to generate prediction',
        risk_percentage: 0,
        risk_level: 'Inconnu',
        risk_color: '#6b7280',
        recommendation: 'Une erreur est survenue lors de la récupération des données fournisseur.',
        will_be_late: false,
      };
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suppliersService.findById(id);
  }

  @Put(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() body: { qhseUserId: string; notes?: string },
  ) {
    return this.suppliersService.approveByQhse(id, body.qhseUserId, body.notes);
  }

  @Put(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: { qhseUserId: string; notes?: string },
  ) {
    return this.suppliersService.rejectByQhse(id, body.qhseUserId, body.notes);
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'contract', maxCount: 1 },
        { name: 'insuranceDocument', maxCount: 1 },
      ],
      {
        storage: createStorage('documents'),
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: (req, file, cb) => {
          if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(
              new BadRequestException(
                'Only PDF, JPG, and PNG files are allowed (max 5MB)',
              ),
              false,
            );
          }
        },
      },
    ),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @UploadedFiles()
    files: {
      contract?: Express.Multer.File[];
      insuranceDocument?: Express.Multer.File[];
    },
  ) {
    const contractFile = files?.contract?.[0];
    const insuranceDocumentFile = files?.insuranceDocument?.[0];

    return this.suppliersService.update(id, dto, contractFile, insuranceDocumentFile);
  }

  @Put(':id/archive')
  async archive(@Param('id') id: string) {
    return this.suppliersService.archive(id);
  }

  @Put(':id/unarchive')
  async unarchive(@Param('id') id: string) {
    return this.suppliersService.unarchive(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }

  @Delete()
  async clear() {
    await this.suppliersService.clear();
  }

  // ── Rating Endpoints ───────────────────────────────────────────────────────

  @Get(':id/ratings')
  getRatings(@Param('id') id: string) {
    return this.suppliersService.getSupplierRatings(id);
  }

  @Get(':id/rating-criteria')
  getRatingCriteria(@Param('id') id: string, @Body() body: { userRole: string }) {
    return {
      criteria: this.suppliersService.getRatingCriteriaByRole(body.userRole),
    };
  }

   @Post(':id/ratings')
   addRating(
     @Param('id') id: string,
     @Body() body: {
       userId: string;
       userName: string;
       userRole: string;
       ratings: Record<string, number>;
       comment?: string;
     },
   ) {
     return this.suppliersService.addRating(
       id,
       body.userId,
       body.userName,
       body.userRole,
       body.ratings,
        body.comment,
      );
    }
  }
