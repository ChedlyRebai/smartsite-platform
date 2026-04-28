import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Supplier, SupplierDocument } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    const supplier = new this.supplierModel(createSupplierDto);
    return supplier.save();
  }

  async findAll(): Promise<Supplier[]> {
    return this.supplierModel.find({ isActive: true }).exec();
  }

  async findOne(id: string): Promise<Supplier> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }
    
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }
    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto): Promise<Supplier> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }

    const supplier = await this.supplierModel
      .findByIdAndUpdate(id, updateSupplierDto, { new: true })
      .exec();
    
    if (!supplier) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }
    return supplier;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }

    // Soft delete - marquer comme inactif au lieu de supprimer
    const result = await this.supplierModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();
    
    if (!result) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }
  }

  async findByMaterial(materialId: string): Promise<Supplier[]> {
    if (!Types.ObjectId.isValid(materialId)) {
      return [];
    }

    return this.supplierModel
      .find({
        isActive: true,
        materialsSupplied: new Types.ObjectId(materialId),
      })
      .exec();
  }

  async findNearby(latitude: number, longitude: number, maxDistance: number = 50): Promise<Supplier[]> {
    return this.supplierModel
      .find({
        isActive: true,
        'coordonnees.latitude': { $exists: true },
        'coordonnees.longitude': { $exists: true },
      })
      .exec()
      .then(suppliers => {
        // Filtrer par distance (calcul simple)
        return suppliers.filter(supplier => {
          if (!supplier.coordonnees?.latitude || !supplier.coordonnees?.longitude) {
            return false;
          }
          
          const distance = this.calculateDistance(
            latitude,
            longitude,
            supplier.coordonnees.latitude,
            supplier.coordonnees.longitude
          );
          
          return distance <= maxDistance;
        });
      });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async addMaterialToSupplier(supplierId: string, materialId: string): Promise<Supplier> {
    if (!Types.ObjectId.isValid(supplierId) || !Types.ObjectId.isValid(materialId)) {
      throw new NotFoundException('ID invalide');
    }

    const supplier = await this.supplierModel.findById(supplierId).exec();
    if (!supplier) {
      throw new NotFoundException(`Fournisseur avec l'ID ${supplierId} non trouvé`);
    }

    const materialObjectId = new Types.ObjectId(materialId);
    if (!supplier.materialsSupplied.includes(materialObjectId)) {
      supplier.materialsSupplied.push(materialObjectId);
      await supplier.save();
    }

    return supplier;
  }

  async removeMaterialFromSupplier(supplierId: string, materialId: string): Promise<Supplier> {
    if (!Types.ObjectId.isValid(supplierId) || !Types.ObjectId.isValid(materialId)) {
      throw new NotFoundException('ID invalide');
    }

    const supplier = await this.supplierModel.findById(supplierId).exec();
    if (!supplier) {
      throw new NotFoundException(`Fournisseur avec l'ID ${supplierId} non trouvé`);
    }

    const materialObjectId = new Types.ObjectId(materialId);
    supplier.materialsSupplied = supplier.materialsSupplied.filter(
      id => !id.equals(materialObjectId)
    );
    await supplier.save();

    return supplier;
  }
}