import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

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
  const app = await NestFactory.create(AppModule);
  app.enableCors(
    {
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    },
  );
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();