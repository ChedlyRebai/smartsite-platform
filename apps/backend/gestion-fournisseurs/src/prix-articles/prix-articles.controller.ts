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
import { PrixArticlesService } from "./prix-articles.service";

@Controller("prix-articles")
export class PrixArticlesController {
  constructor(private readonly prixArticlesService: PrixArticlesService) {}

  @Post()
  create(@Body() createPrixArticleDto: any) {
    return this.prixArticlesService.create(createPrixArticleDto);
  }

  @Get()
  findAll(@Query("actif") actif?: string) {
    if (actif === "true") {
      return this.prixArticlesService.findActifs();
    }
    return this.prixArticlesService.findAll();
  }

  @Get("fournisseur/:fournisseurId")
  findByFournisseur(@Param("fournisseurId") fournisseurId: string) {
    return this.prixArticlesService.findByFournisseur(fournisseurId);
  }

  @Get("article/:articleId")
  findByArticle(@Param("articleId") articleId: string) {
    return this.prixArticlesService.findByArticle(articleId);
  }

  @Get("comparaison/:articleId")
  getComparaisonPrix(@Param("articleId") articleId: string) {
    return this.prixArticlesService.getComparaisonPrix(articleId);
  }

  @Get("historique/:fournisseurId/:articleId")
  getHistoriquePrix(
    @Param("fournisseurId") fournisseurId: string,
    @Param("articleId") articleId: string,
  ) {
    return this.prixArticlesService.getHistoriquePrix(fournisseurId, articleId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    // You can add a findById method if needed
    return this.prixArticlesService.findActifs();
  }

  @Post("update-prix")
  updatePrix(
    @Body()
    body: {
      fournisseurId: string;
      articleId: string;
      nouveauPrix: number;
      tauxTva?: number;
    },
  ) {
    return this.prixArticlesService.updatePrix(
      body.fournisseurId,
      body.articleId,
      body.nouveauPrix,
      body.tauxTva,
    );
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() updatePrixArticleDto: any) {
    return this.prixArticlesService.update(id, updatePrixArticleDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.prixArticlesService.remove(id);
  }
}
