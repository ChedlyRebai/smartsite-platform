import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Fournisseur, FournisseurSchema } from "./entities/fournisseur.entity";
import { FournisseursService } from "./fournisseurs.service";
import { FournisseursController } from "./fournisseurs.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Fournisseur.name, schema: FournisseurSchema },
    ]),
  ],
  controllers: [FournisseursController],
  providers: [FournisseursService],
  exports: [FournisseursService],
})
export class FournisseursModule {}
