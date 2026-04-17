import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import {
  CreateCatalogItemDto,
  UpdateCatalogItemDto,
  CatalogItemQueryDto,
} from './dto/catalog-item.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  create(@Body() createDto: CreateCatalogItemDto) {
    return this.catalogService.create(createDto);
  }

  @Get()
  findAll(@Query() query: CatalogItemQueryDto) {
    return this.catalogService.findAll(query);
  }

  @Get('categories')
  getCategories() {
    return this.catalogService.getCategories();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.catalogService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateCatalogItemDto) {
    return this.catalogService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.catalogService.remove(id);
  }
}
