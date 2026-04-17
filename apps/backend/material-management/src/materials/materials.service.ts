import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Material } from './entities/material.entity';
import { CreateMaterialInput, UpdateMaterialInput } from './dto/material.dto';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectModel(Material.name) private materialModel: Model<Material>,
  ) {}

  private getConnection() {
    return this.materialModel.db;
  }

  private async supplierExists(supplierId: string): Promise<boolean> {
    const suppliersCollection = this.getConnection().collection('suppliers');
    const supplier = await suppliersCollection.findOne({
      _id: new Types.ObjectId(supplierId),
      is_active: true,
    });
    return !!supplier;
  }

  async create(createMaterialDto: CreateMaterialInput): Promise<Material> {
    // Vérifier code unique
    const existingCode = await this.materialModel
      .findOne({ code: createMaterialDto.code })
      .exec();
    if (existingCode) {
      throw new ConflictException('A material with this code already exists');
    }

    // Vérifier que le supplier existe et est actif
    const supplierExists = await this.supplierExists(createMaterialDto.supplier_id);
    if (!supplierExists) {
      throw new BadRequestException('Supplier does not exist or is inactive');
    }

    const createdMaterial = new this.materialModel({
      ...createMaterialDto,
      supplier_id: createMaterialDto.supplier_id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return createdMaterial.save();
  }

  async findAll(includeInactive: boolean = false): Promise<Material[]> {
    const query = includeInactive ? {} : { is_active: true };
    return this.materialModel
      .find(query)
      .sort({ created_at: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Material> {
    const material = await this.materialModel
      .findById(id)
      .exec();

    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    return material;
  }

  async update(
    id: string,
    updateMaterialDto: UpdateMaterialInput,
  ): Promise<Material> {
    const material = await this.findOne(id);

    // Vérifier code unique si changement
    if (updateMaterialDto.code && updateMaterialDto.code !== material.code) {
      const existingCode = await this.materialModel
        .findOne({ code: updateMaterialDto.code, _id: { $ne: id } })
        .exec();
      if (existingCode) {
        throw new ConflictException('A material with this code already exists');
      }
    }

    // Vérifier supplier_id si changement
    if (updateMaterialDto.supplier_id && updateMaterialDto.supplier_id !== material.supplier_id.toString()) {
      const supplierExists = await this.supplierExists(updateMaterialDto.supplier_id);
      if (!supplierExists) {
        throw new BadRequestException('Supplier does not exist or is inactive');
      }
    }

    const updateData: any = { ...updateMaterialDto };
    updateData.updated_at = new Date();

    const updatedMaterial = await this.materialModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedMaterial) {
      throw new NotFoundException(`Material with ID ${id} not found after update`);
    }

    return updatedMaterial;
  }

  async softDelete(id: string): Promise<Material> {
    const material = await this.findOne(id);

    if (!material.is_active) {
      throw new BadRequestException('Material is already inactive');
    }

    material.is_active = false;
    material.updated_at = new Date();

    return material.save();
  }

  async reactivate(id: string): Promise<Material> {
    const material = await this.findOne(id);

    if (material.is_active) {
      throw new BadRequestException('Material is already active');
    }

    material.is_active = true;
    material.updated_at = new Date();

    return material.save();
  }

  async getActiveSuppliers() {
    const suppliersCollection = this.getConnection().collection('suppliers');
    return suppliersCollection
      .find({ is_active: true })
      .project({ _id: 1, name: 1, code: 1 })
      .sort({ name: 1 })
      .toArray();
  }
}
