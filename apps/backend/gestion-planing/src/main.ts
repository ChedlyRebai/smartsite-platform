import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import compression from 'compression';
function getAllowedOrigins(): string[] {
  const defaultOrigin = 'http://localhost:5173';
  const rawOrigins = process.env.CORS_ORIGIN;

  if (!rawOrigins) {
    return [defaultOrigin];
  }

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule,new FastifyAdapter());
  //app.use(compression());
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.use(
    compression({
      level: 6, // balance between speed & compression
      threshold: 1024, // only compress responses > 1KB
    }),
  );
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
