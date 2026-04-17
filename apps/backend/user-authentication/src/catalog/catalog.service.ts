import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CatalogItem } from './entities/catalog-item.entity';
import {
  CreateCatalogItemDto,
  UpdateCatalogItemDto,
  CatalogItemQueryDto,
} from './dto/catalog-item.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(CatalogItem.name) private catalogModel: Model<CatalogItem>,
  ) {}

  async create(createDto: CreateCatalogItemDto): Promise<CatalogItem> {
    const created = new this.catalogModel(createDto);
    return created.save();
  }

  async findAll(query: CatalogItemQueryDto): Promise<{
    data: CatalogItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { search, category, status, page = '1', limit = '10' } = query;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) filter.category = category;
    if (status) filter.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      this.catalogModel
        .find(filter)
        .skip(skip)
        .limit(limitNum)
        .sort({ name: 1 })
        .exec(),
      this.catalogModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page: pageNum, limit: limitNum };
  }

  async findOne(id: string): Promise<CatalogItem> {
    const item = await this.catalogModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException(`Catalog item with id ${id} not found`);
    }
    return item;
  }

  async update(
    id: string,
    updateDto: UpdateCatalogItemDto,
  ): Promise<CatalogItem> {
    const item = await this.catalogModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
    if (!item) {
      throw new NotFoundException(`Catalog item with id ${id} not found`);
    }
    return item;
  }

  async remove(id: string): Promise<void> {
    const result = await this.catalogModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Catalog item with id ${id} not found`);
    }
  }

  async getCategories(): Promise<string[]> {
    const categories = await this.catalogModel.distinct('category').exec();
    return categories.filter((c) => c);
  }
}
