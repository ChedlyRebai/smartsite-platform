import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SupplierMaterial } from './entities/supplier-material.entity';
import { CreateSupplierMaterialDto, UpdateSupplierMaterialDto, SupplierMaterialQueryDto } from './dto/supplier-material.dto';

@Injectable()
export class SuppliersMaterialsService {
  constructor(
    @InjectModel(SupplierMaterial.name) private supplierMaterialModel: Model<SupplierMaterial>,
  ) {}

  async create(createDto: CreateSupplierMaterialDto): Promise<SupplierMaterial> {
    const existing = await this.supplierMaterialModel.findOne({
      supplierId: new Types.ObjectId(createDto.supplierId),
      catalogItemId: new Types.ObjectId(createDto.catalogItemId),
    });

    if (existing) {
      throw new Error('This supplier-material relationship already exists');
    }

    const created = new this.supplierMaterialModel({
      ...createDto,
      supplierId: new Types.ObjectId(createDto.supplierId),
      catalogItemId: new Types.ObjectId(createDto.catalogItemId),
    });
    return created.save();
  }

  async findAll(query: SupplierMaterialQueryDto): Promise<{ data: SupplierMaterial[]; total: number; page: number; limit: number }> {
    const { supplierId, catalogItemId, page = '1', limit = '10' } = query;
    
    const filter: any = {};
    
    if (supplierId) filter.supplierId = new Types.ObjectId(supplierId);
    if (catalogItemId) filter.catalogItemId = new Types.ObjectId(catalogItemId);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const [data, total] = await Promise.all([
      this.supplierMaterialModel.find(filter)
        .populate('supplierId', 'name supplierCode')
        .populate('catalogItemId', 'code name category unit')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 })
        .exec(),
      this.supplierMaterialModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page: pageNum, limit: limitNum };
  }

  async findBySupplier(supplierId: string): Promise<SupplierMaterial[]> {
    return this.supplierMaterialModel.find({ supplierId: new Types.ObjectId(supplierId) })
      .populate('catalogItemId', 'code name category unit')
      .exec();
  }

  async findByCatalogItem(catalogItemId: string): Promise<SupplierMaterial[]> {
    return this.supplierMaterialModel.find({ catalogItemId: new Types.ObjectId(catalogItemId) })
      .populate('supplierId', 'name supplierCode')
      .sort({ unitPrice: 1 })
      .exec();
  }

  async findOne(id: string): Promise<SupplierMaterial> {
    const item = await this.supplierMaterialModel.findById(id)
      .populate('supplierId', 'name supplierCode')
      .populate('catalogItemId', 'code name category unit')
      .exec();
    if (!item) {
      throw new NotFoundException(`Supplier-material relationship with id ${id} not found`);
    }
    return item;
  }

  async update(id: string, updateDto: UpdateSupplierMaterialDto): Promise<SupplierMaterial> {
    const item = await this.supplierMaterialModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .populate('supplierId', 'name supplierCode')
      .populate('catalogItemId', 'code name category unit')
      .exec();
    if (!item) {
      throw new NotFoundException(`Supplier-material relationship with id ${id} not found`);
    }
    return item;
  }

  async remove(id: string): Promise<void> {
    const result = await this.supplierMaterialModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Supplier-material relationship with id ${id} not found`);
    }
  }
}