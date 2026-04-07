import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { PrixArticle } from "./entities/prix-article.entity";

@Injectable()
export class PrixArticlesService {
  constructor(
    @InjectModel(PrixArticle.name) private prixArticleModel: Model<PrixArticle>,
  ) {}

  async create(createPrixArticleDto: any) {
    // Vérifier si un prix actif existe déjà
    const existing = await this.prixArticleModel.findOne({
      fournisseurId: createPrixArticleDto.fournisseurId,
      articleId: createPrixArticleDto.articleId,
      estActif: true,
    });

    if (existing) {
      // Désactiver l'ancien prix et sauvegarder le prix précédent
      existing.estActif = false;
      existing.prixPrecedent = existing.prixUnitaire;
      existing.dateFin = new Date();
      await existing.save();
    }

    const prixArticle = new this.prixArticleModel({
      ...createPrixArticleDto,
      dateDebut: new Date(),
    });
    return prixArticle.save();
  }

  async findAll() {
    return this.prixArticleModel
      .find()
      .populate("fournisseurId")
      .populate("articleId")
      .sort({ createdAt: -1 })
      .exec();
  }

  async findActifs() {
    return this.prixArticleModel
      .find({ estActif: true })
      .populate("fournisseurId")
      .populate("articleId")
      .exec();
  }

  async findByFournisseur(fournisseurId: string) {
    return this.prixArticleModel
      .find({ fournisseurId })
      .populate("articleId")
      .sort({ articleId: 1 })
      .exec();
  }

  async findByArticle(articleId: string) {
    return this.prixArticleModel
      .find({ articleId })
      .populate("fournisseurId")
      .sort({ createdAt: -1 })
      .exec();
  }

  async getPrixActif(fournisseurId: string, articleId: string) {
    const prix = await this.prixArticleModel
      .findOne({
        fournisseurId,
        articleId,
        estActif: true,
      })
      .populate("fournisseurId")
      .populate("articleId");

    if (!prix) {
      throw new NotFoundException("Prix non trouvé");
    }
    return prix;
  }

  async getComparaisonPrix(articleId: string) {
    return this.prixArticleModel
      .find({ articleId, estActif: true })
      .populate("fournisseurId")
      .sort({ prixUnitaire: 1 })
      .exec();
  }

  async getHistoriquePrix(fournisseurId: string, articleId: string) {
    return this.prixArticleModel
      .find({ fournisseurId, articleId })
      .populate("fournisseurId")
      .populate("articleId")
      .sort({ dateDebut: -1 })
      .exec();
  }

  async update(id: string, updatePrixArticleDto: any) {
    const prixArticle = await this.prixArticleModel
      .findByIdAndUpdate(id, updatePrixArticleDto, { new: true })
      .populate("fournisseurId")
      .populate("articleId");

    if (!prixArticle) {
      throw new NotFoundException(`Prix ${id} non trouvé`);
    }
    return prixArticle;
  }

  async remove(id: string) {
    const prixArticle = await this.prixArticleModel
      .findByIdAndDelete(id)
      .exec();
    if (!prixArticle) {
      throw new NotFoundException(`Prix ${id} non trouvé`);
    }
    return { message: "Prix supprimé avec succès" };
  }

  async updatePrix(
    fournisseurId: string,
    articleId: string,
    nouveauPrix: number,
    tauxTva?: number,
  ) {
    // Désactiver l'ancien prix
    await this.prixArticleModel.updateMany(
      { fournisseurId, articleId, estActif: true },
      {
        estActif: false,
        dateFin: new Date(),
        prixPrecedent: undefined, // Will be set manually below
      },
    );

    // Récupérer l'ancien prix
    const ancienPrix = await this.prixArticleModel.findOne({
      fournisseurId,
      articleId,
      dateFin: new Date(),
    });

    // Créer le nouveau prix
    const nouveauPrixArticle = new this.prixArticleModel({
      fournisseurId: new Types.ObjectId(fournisseurId),
      articleId: new Types.ObjectId(articleId),
      prixUnitaire: nouveauPrix,
      tauxTva: tauxTva || 19,
      dateDebut: new Date(),
      estActif: true,
      prixPrecedent: ancienPrix?.prixUnitaire,
      dateModification: new Date(),
    });

    return nouveauPrixArticle.save();
  }
}
