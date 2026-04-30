import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { ArticlesService } from "./articles.service";

@Controller("articles")
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  create(@Body() createArticleDto: any) {
    return this.articlesService.create(createArticleDto);
  }

  @Get()
  findAll(@Query("actif") actif?: string) {
    if (actif === "true") {
      return this.articlesService.findActifs();
    }
    return this.articlesService.findAll();
  }

  @Get("search")
  search(@Query("q") term: string) {
    return this.articlesService.search(term);
  }

  @Get("categorie/:categorie")
  findByCategorie(@Param("categorie") categorie: string) {
    return this.articlesService.findByCategorie(categorie);
  }

  @Get("low-stock")
  getLowStock() {
    return this.articlesService.getLowStock();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.articlesService.findById(id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() updateArticleDto: any) {
    return this.articlesService.update(id, updateArticleDto);
  }

  @Put(":id/stock")
  updateStock(@Param("id") id: string, @Body() body: { quantite: number }) {
    return this.articlesService.updateStock(id, body.quantite);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.articlesService.remove(id);
  }
}
