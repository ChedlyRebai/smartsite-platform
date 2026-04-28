import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Article } from "./entities/article.entity";

@Injectable()
export class ArticlesService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<Article>,
  ) {}

  async create(createArticleDto: any) {
    const article = new this.articleModel(createArticleDto);
    return article.save();
  }

  async findAll() {
    return this.articleModel.find().sort({ code: 1 }).exec();
  }

  async findActifs() {
    return this.articleModel.find({ estActif: true }).sort({ code: 1 }).exec();
  }

  async findById(id: string) {
    const article = await this.articleModel.findById(id).exec();
    if (!article) {
      throw new NotFoundException(`Article ${id} non trouvé`);
    }
    return article;
  }

  async findByCode(code: string) {
    return this.articleModel.findOne({ code }).exec();
  }

  async findByCategorie(categorie: string) {
    return this.articleModel.find({ categorie }).sort({ code: 1 }).exec();
  }

  async search(term: string) {
    return this.articleModel
      .find({
        $or: [
          { code: { $regex: term, $options: "i" } },
          { designation: { $regex: term, $options: "i" } },
        ],
      })
      .exec();
  }

  async update(id: string, updateArticleDto: any) {
    const article = await this.articleModel
      .findByIdAndUpdate(id, updateArticleDto, { new: true })
      .exec();
    if (!article) {
      throw new NotFoundException(`Article ${id} non trouvé`);
    }
    return article;
  }

  async remove(id: string) {
    const article = await this.articleModel.findByIdAndDelete(id).exec();
    if (!article) {
      throw new NotFoundException(`Article ${id} non trouvé`);
    }
    return { message: "Article supprimé avec succès" };
  }

  async updateStock(id: string, quantite: number) {
    const article = await this.articleModel.findById(id).exec();
    if (!article) {
      throw new NotFoundException(`Article ${id} non trouvé`);
    }
    article.stock += quantite;
    return article.save();
  }

  async getLowStock() {
    return this.articleModel
      .find({
        $expr: { $lte: ["$stock", "$stockMinimum"] },
        estActif: true,
      })
      .exec();
  }
}
