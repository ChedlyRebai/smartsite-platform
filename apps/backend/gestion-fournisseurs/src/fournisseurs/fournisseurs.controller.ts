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
import { FournisseursService } from "./fournisseurs.service";

@Controller("fournisseurs")
export class FournisseursController {
  constructor(private readonly fournisseursService: FournisseursService) {}

  @Post()
  create(@Body() createFournisseurDto: any) {
    return this.fournisseursService.create(createFournisseurDto);
  }

  @Get()
  findAll(@Query("actif") actif?: string) {
    if (actif === "true") {
      return this.fournisseursService.findActifs();
    }
    return this.fournisseursService.findAll();
  }

  @Get("search")
  search(@Query("nom") nom: string) {
    return this.fournisseursService.findByNom(nom);
  }

  @Get("categorie/:categorie")
  findByCategorie(@Param("categorie") categorie: string) {
    return this.fournisseursService.findByCategorie(categorie);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.fournisseursService.findById(id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() updateFournisseurDto: any) {
    return this.fournisseursService.update(id, updateFournisseurDto);
  }

  @Put(":id/note")
  updateNote(@Param("id") id: string, @Body() body: { noteFiabilite: number }) {
    return this.fournisseursService.updateNote(id, body.noteFiabilite);
  }

  @Put(":id/notes")
  updateNotes(
    @Param("id") id: string,
    @Body()
    body: {
      noteFiabilite?: number;
      noteQualite?: number;
      noteRespectDelais?: number;
    },
  ) {
    return this.fournisseursService.updateNotes(
      id,
      body.noteFiabilite,
      body.noteQualite,
      body.noteRespectDelais,
    );
  }

  @Put(":id/archive")
  archive(@Param("id") id: string) {
    return this.fournisseursService.archive(id);
  }

  @Put(":id/unarchive")
  unarchive(@Param("id") id: string) {
    return this.fournisseursService.unarchive(id);
  }

  @Post(":id/interactions")
  addInteraction(@Param("id") id: string, @Body() body: any) {
    return this.fournisseursService.addInteraction(id, body);
  }

  @Put(":id/toggle")
  toggleActif(@Param("id") id: string) {
    return this.fournisseursService.toggleActif(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.fournisseursService.remove(id);
  }
}
