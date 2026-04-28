import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as path from 'path';
import { Supplier, SupplierDocument, SupplierStatus } from './entities/supplier.entity';
import { SupplierRating, SupplierRatingDocument } from './entities/supplier-rating.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
const NOTIFICATION_API = 'http://localhost:3004/notification';
const USER_API = 'http://localhost:3000/users';

const RATING_CRITERIA_BY_ROLE: Record<string, string[]> = {
  procurement_manager: ['Delays', 'Communication', 'Price', 'Reliability'],
  site_manager: ['Material Quality'],
  project_manager: ['Quality', 'Delays'],
  qhse_manager: ['Safety Compliance'],
};

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name)
    private supplierModel: Model<SupplierDocument>,
    @InjectModel(SupplierRating.name)
    private ratingModel: Model<SupplierRatingDocument>,
    private httpService: HttpService,
  ) {}

  // Auto-generate supplier code: FRS-2026-001
  private async generateSupplierCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `FRS-${year}-`;

    const lastSupplier = await this.supplierModel
      .findOne({ supplierCode: { $regex: `^${prefix}` } })
      .sort({ supplierCode: -1 })
      .exec();

    let nextNumber = 1;
    if (lastSupplier) {
      const lastCode = lastSupplier.supplierCode;
      const lastNum = parseInt(lastCode.split('-')[2], 10);
      nextNumber = lastNum + 1;
    }

    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
  }

   async create(
     dto: CreateSupplierDto,
     contractFile: Express.Multer.File,
     insuranceDocumentFile: Express.Multer.File,
   ): Promise<any> {
     if (!contractFile) {
       throw new BadRequestException(
         'Contract document is required. Please upload a PDF, JPG, or PNG file (max 5MB)',
       );
     }
     if (!insuranceDocumentFile) {
       throw new BadRequestException(
         'Insurance document is required. Please upload a PDF, JPG, or PNG file (max 5MB)',
       );
     }

     const supplierCode = await this.generateSupplierCode();

     const supplier = new this.supplierModel({
       ...dto,
       supplierCode,
       contractUrl: `/uploads/documents/${contractFile.filename}`,
       insuranceDocumentUrl: `/uploads/documents/${insuranceDocumentFile.filename}`,
       status: SupplierStatus.PENDING_QHSE,
     });

     let saved;
     try {
       saved = await supplier.save();
     } catch (error) {
       if (error.code === 11000) {
         throw new ConflictException(`A supplier with this email already exists: ${dto.email}`);
       }
       throw error;
     }

     return saved.toObject();
   }

  async findAll(): Promise<any[]> {
    const suppliers = await this.supplierModel.find().sort({ createdAt: -1 }).exec();
    
    const suppliersWithRatings = await Promise.all(
      suppliers.map(async (supplier) => {
        const stats = await this.getSupplierRatingStats(supplier._id.toString());
        return {
          ...supplier.toObject(),
          averageRating: stats.averageRating,
          ratingCount: stats.ratingCount,
        };
      })
    );
    
    return suppliersWithRatings;
  }

  async findPendingQhse(): Promise<Supplier[]> {
    return this.supplierModel
      .find({ status: SupplierStatus.PENDING_QHSE })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<any> {
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) throw new NotFoundException('Supplier not found');
    
    const ratingStats = await this.getSupplierRatingStats(id);
    
    return {
      ...supplier.toObject(),
      averageRating: ratingStats.averageRating,
      ratingCount: ratingStats.ratingCount,
      criteriaAverages: ratingStats.criteriaAverages,
    };
  }

  async approveByQhse(
    id: string,
    qhseUserId: string,
    notes?: string,
  ): Promise<Supplier> {
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) throw new NotFoundException('Supplier not found');
    
    supplier.status = SupplierStatus.APPROVED;
    supplier.qhseValidatedBy = qhseUserId;
    supplier.qhseValidatedAt = new Date();
    supplier.qhseNotes = notes || '';
    const updated = await (supplier as SupplierDocument).save();

    // Notify procurement manager who created the supplier (disabled for now)
    // await this.notifyProcurementManager(updated, 'approved');

    return updated;
  }

  async rejectByQhse(
    id: string,
    qhseUserId: string,
    notes?: string,
  ): Promise<Supplier> {
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) throw new NotFoundException('Supplier not found');
    
    supplier.status = SupplierStatus.REJECTED;
    supplier.qhseValidatedBy = qhseUserId;
    supplier.qhseValidatedAt = new Date();
    supplier.qhseNotes = notes || '';
    const updated = await (supplier as SupplierDocument).save();

    // Notify procurement manager who created the supplier (disabled for now)
    // await this.notifyProcurementManager(updated, 'rejected');

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.supplierModel.findByIdAndDelete(id).exec();
  }

  async update(
    id: string,
    dto: UpdateSupplierDto,
    contractFile?: Express.Multer.File,
    insuranceDocumentFile?: Express.Multer.File,
  ): Promise<Supplier> {
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) throw new NotFoundException('Supplier not found');

    // Update basic fields only if provided
    if (dto.name) supplier.name = dto.name;
    if (dto.category) supplier.category = dto.category;
    if (dto.email) supplier.email = dto.email;
    if (dto.phone) supplier.phone = dto.phone;
    if (dto.address) supplier.address = dto.address;
    if (dto.siret) supplier.siret = dto.siret;

    // Update files if provided
    if (contractFile) {
      supplier.contractUrl = `/uploads/documents/${contractFile.filename}`;
    }
    if (insuranceDocumentFile) {
      supplier.insuranceDocumentUrl = `/uploads/documents/${insuranceDocumentFile.filename}`;
    }

    // Si le fournisseur était rejeté, on le réactive pour re-approbation
    if (supplier.status === 'rejected') {
      supplier.status = 'pending_qhse';
      supplier.qhseValidatedBy = undefined;
      supplier.qhseValidatedAt = undefined;
    }

    const saved = await (supplier as SupplierDocument).save();

    return saved;
  }

  async archive(id: string): Promise<Supplier> {
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) throw new NotFoundException('Supplier not found');
    supplier.estArchive = true;
    return (supplier as SupplierDocument).save();
  }

  async unarchive(id: string): Promise<Supplier> {
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) throw new NotFoundException('Supplier not found');
    supplier.estArchive = false;
    return (supplier as SupplierDocument).save();
  }

  async clear(): Promise<void> {
    await this.supplierModel.deleteMany({}).exec();
  }

  // ── Rating Methods ───────────────────────────────────────────────────────────

  getRatingCriteriaByRole(role: string): string[] {
    return RATING_CRITERIA_BY_ROLE[role] || [];
  }

  async addRating(
    supplierId: string,
    userId: string,
    userName: string,
    userRole: string,
    ratings: Record<string, number>,
    comment?: string,
  ): Promise<SupplierRating> {
    const supplier = await this.supplierModel.findById(supplierId).exec();
    if (!supplier) throw new NotFoundException('Supplier not found');
    
    // Check if user has already rated today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const existingRating = await this.ratingModel.findOne({
      supplierId: new Types.ObjectId(supplierId),
      userId,
      createdAt: { $gte: startOfDay },
    }).exec();
    
    if (existingRating) {
      throw new BadRequestException('You have already rated this supplier today. Please try again tomorrow.');
    }

    const validCriteria = RATING_CRITERIA_BY_ROLE[userRole] || [];

    for (const criterion of Object.keys(ratings)) {
      if (!validCriteria.includes(criterion)) {
        throw new BadRequestException(`Invalid rating criterion: ${criterion}`);
      }
      if (ratings[criterion] < 0 || ratings[criterion] > 10) {
        throw new BadRequestException('Rating must be between 0 and 10');
      }
    }

    const rating = new this.ratingModel({
      supplierId: new Types.ObjectId(supplierId),
      userId,
      userName,
      userRole,
      ratings,
      comment,
    });

    return rating.save();
  }

  async getSupplierRatings(supplierId: string): Promise<SupplierRating[]> {
    return this.ratingModel.find({ supplierId: new Types.ObjectId(supplierId) }).sort({ createdAt: -1 }).exec();
  }

  async getSupplierRatingStats(supplierId: string): Promise<{ averageRating: number; ratingCount: number; criteriaAverages: Record<string, number> }> {
    const ratings = await this.ratingModel.find({ supplierId: new Types.ObjectId(supplierId) }).exec();
    
    if (ratings.length === 0) {
      return { averageRating: 0, ratingCount: 0, criteriaAverages: {} };
    }

    const criteriaSums: Record<string, { sum: number; count: number }> = {};
    let totalSum = 0;

    for (const rating of ratings) {
      for (const [criterion, value] of Object.entries(rating.ratings)) {
        if (!criteriaSums[criterion]) {
          criteriaSums[criterion] = { sum: 0, count: 0 };
        }
        criteriaSums[criterion].sum += value;
        criteriaSums[criterion].count += 1;
        totalSum += value;
      }
    }

    const criteriaAverages: Record<string, number> = {};
    for (const [criterion, data] of Object.entries(criteriaSums)) {
      criteriaAverages[criterion] = Math.round((data.sum / data.count) * 10) / 10;
    }

    return {
      averageRating: Math.round((totalSum / ratings.length) * 10) / 10,
      ratingCount: ratings.length,
      criteriaAverages,
    };
  }

  // ── Notification helpers ────────────────────────────────────────────────────

  private async notifyQhseManagers(supplier: Supplier): Promise<void> {
    try {
      // Get all QHSE managers from user service
      const response = await firstValueFrom(
        this.httpService.get(`${USER_API}/role/qhse_manager`),
      );
      const qhseManagers = response.data || [];

      // Send notification to each QHSE manager
      for (const manager of qhseManagers) {
        await firstValueFrom(
          this.httpService.post(NOTIFICATION_API, {
            title: 'New Supplier Pending Validation',
            message: `Supplier "${supplier.name}" (${supplier.supplierCode}) has been created by ${supplier.createdByName} and requires your validation.`,
            recipentId: manager._id,
            type: 'INFO',
            priority: 'MEDIUM',
            isRead: false,
          }),
        );
      }
    } catch (error) {
      console.error('Failed to notify QHSE managers:', error.message);
    }
  }

  private async notifyProcurementManager(
    supplier: Supplier,
    action: 'approved' | 'rejected',
  ): Promise<void> {
    try {
      const title =
        action === 'approved'
          ? 'Supplier Approved'
          : 'Supplier Rejected';
      const message =
        action === 'approved'
          ? `Your supplier "${supplier.name}" (${supplier.supplierCode}) has been approved by QHSE Manager.`
          : `Your supplier "${supplier.name}" (${supplier.supplierCode}) has been rejected.`;

      await firstValueFrom(
        this.httpService.post(NOTIFICATION_API, {
          title,
          message,
          qhseNotes: supplier.qhseNotes || 'No reason provided',
          recipentId: supplier.createdBy,
          type: action === 'approved' ? 'SUCCESS' : 'WARNING',
          priority: 'HIGH',
          isRead: false,
        }),
      );
    } catch (error) {
      console.error('Failed to notify procurement manager:', error.message);
    }
  }
}
