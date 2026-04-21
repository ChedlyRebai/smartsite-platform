import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { ProjectsModule } from "./projects/projects.module";
import { ChatModule } from "./chat/chat.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || "mongodb://localhost:27017/smartsite"),
    ProjectsModule,
    ChatModule,
  ],
})
export class AppModule {}
