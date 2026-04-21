import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { FournisseursModule } from "./fournisseurs/fournisseurs.module";
import { ArticlesModule } from "./articles/articles.module";
import { PrixArticlesModule } from "./prix-articles/prix-articles.module";
import { ChatModule } from "./chat/chat.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI ||
        "mongodb+srv://admin:admin@cluster0.6zcerbm.mongodb.net/smartsite",
    ),
    FournisseursModule,
    ArticlesModule,
    PrixArticlesModule,
    ChatModule,
  ],
})
export class AppModule {}
