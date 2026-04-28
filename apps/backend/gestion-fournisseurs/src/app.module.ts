import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { FournisseursModule } from "./fournisseurs/fournisseurs.module";
import { ArticlesModule } from "./articles/articles.module";
import { PrixArticlesModule } from "./prix-articles/prix-articles.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/smartsite-fournisseurs",
    ),
    FournisseursModule,
    ArticlesModule,
    PrixArticlesModule,
  ],
})
export class AppModule {}
