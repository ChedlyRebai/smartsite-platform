import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS so the frontend can call the gateway directly
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT ?? 9001;
  await app.listen(port);

  console.log(`🚀 API Gateway running on: http://localhost:${port}`);
  console.log(`   /planning   → gestion-planing  (${process.env.GESTION_PLANING_URL ?? 'http://localhost:3002'})`);
  console.log(`   /sites      → gestion-site     (${process.env.GESTION_SITE_URL ?? 'http://localhost:3001'})`);
  console.log(`   /projects   → gestion-projects (${process.env.GESTION_PROJECTS_URL ?? 'http://localhost:3010'})`);
  console.log(`   /notification → notification   (${process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:3004'})`);
  console.log(`   /videocall  → videocall         (${process.env.VIDEOCALL_SERVICE_URL ?? 'http://localhost:9000'})`);
}
bootstrap();
