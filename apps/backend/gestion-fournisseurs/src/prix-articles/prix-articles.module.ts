import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PrixArticle, PrixArticleSchema } from "./entities/prix-article.entity";
import { PrixArticlesService } from "./prix-articles.service";
import { PrixArticlesController } from "./prix-articles.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PrixArticle.name, schema: PrixArticleSchema },
    ]),
  ],
  controllers: [PrixArticlesController],
  providers: [PrixArticlesService],
  exports: [PrixArticlesService],
})
export class PrixArticlesModule {}
