import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Fournisseur } from "./entities/fournisseur.entity";

@Injectable()
export class FournisseursService {
  constructor(
    @InjectModel(Fournisseur.name) private fournisseurModel: Model<Fournisseur>,
  ) {}

  async create(createFournisseurDto: any) {
    const fournisseur = new this.fournisseurModel(createFournisseurDto);
    return fournisseur.save();
  }

  async findAll() {
    return this.fournisseurModel.find().sort({ nom: 1 }).exec();
  }

  async findActifs() {
    return this.fournisseurModel
      .find({ estActif: true })
      .sort({ nom: 1 })
      .exec();
  }

  async findById(id: string) {
    const fournisseur = await this.fournisseurModel.findById(id).exec();
    if (!fournisseur) {
      throw new NotFoundException(`Fournisseur ${id} non trouvé`);
    }
    return fournisseur;
  }

  async findByNom(nom: string) {
    return this.fournisseurModel
      .find({
        nom: { $regex: nom, $options: "i" },
      })
      .exec();
  }

  async findByCategorie(categorie: string) {
    return this.fournisseurModel.find({ categorie }).sort({ nom: 1 }).exec();
  }

  async update(id: string, updateFournisseurDto: any) {
    const fournisseur = await this.fournisseurModel
      .findByIdAndUpdate(id, updateFournisseurDto, { new: true })
      .exec();
    if (!fournisseur) {
      throw new NotFoundException(`Fournisseur ${id} non trouvé`);
    }
    return fournisseur;
  }

  async remove(id: string) {
    const fournisseur = await this.fournisseurModel
      .findByIdAndDelete(id)
      .exec();
    if (!fournisseur) {
      throw new NotFoundException(`Fournisseur ${id} non trouvé`);
    }
    return { message: "Fournisseur supprimé avec succès" };
  }

  async updateNote(id: string, noteFiabilite: number) {
    const fournisseur = await this.fournisseurModel
      .findByIdAndUpdate(id, { noteFiabilite }, { new: true })
      .exec();
    return fournisseur;
  }

  async toggleActif(id: string) {
    const fournisseur = await this.fournisseurModel.findById(id).exec();
    if (!fournisseur) {
      throw new NotFoundException(`Fournisseur ${id} non trouvé`);
    }
    fournisseur.estActif = !fournisseur.estActif;
    return fournisseur.save();
  }

  async archive(id: string) {
    const fournisseur = await this.fournisseurModel
      .findByIdAndUpdate(
        id,
        { estArchive: true, estActif: false },
        { new: true },
      )
      .exec();
    if (!fournisseur) {
      throw new NotFoundException(`Fournisseur ${id} non trouvé`);
    }
    return fournisseur;
  }

  async unarchive(id: string) {
    const fournisseur = await this.fournisseurModel
      .findByIdAndUpdate(id, { estArchive: false }, { new: true })
      .exec();
    if (!fournisseur) {
      throw new NotFoundException(`Fournisseur ${id} non trouvé`);
    }
    return fournisseur;
  }

  async addInteraction(id: string, interaction: any) {
    const fournisseur = await this.fournisseurModel.findById(id).exec();
    if (!fournisseur) {
      throw new NotFoundException(`Fournisseur ${id} non trouvé`);
    }

    if (!fournisseur.historiqueInteractions) {
      fournisseur.historiqueInteractions = [];
    }

    fournisseur.historiqueInteractions.push({
      date: new Date(),
      type: interaction.type,
      description: interaction.description,
      montant: interaction.montant,
      evaluation: interaction.evaluation,
    });

    // Mettre à jour les notes
    if (interaction.evaluation) {
      if (interaction.type === "retard") {
        fournisseur.nombreRetards = (fournisseur.nombreRetards || 0) + 1;
      }
    }

    return fournisseur.save();
  }

  async updateNotes(
    id: string,
    noteFiabilite: number,
    noteQualite?: number,
    noteRespectDelais?: number,
  ) {
    const updateData: any = { noteFiabilite };
    if (noteQualite !== undefined) updateData.noteQualite = noteQualite;
    if (noteRespectDelais !== undefined)
      updateData.noteRespectDelais = noteRespectDelais;

    const fournisseur = await this.fournisseurModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!fournisseur) {
      throw new NotFoundException(`Fournisseur ${id} non trouvé`);
    }
    return fournisseur;
  }
}
