import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { AppModule } from './app.module';

const server = express();
let appInitialized = false;

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

async function bootstrapServer() {
  if (appInitialized) {
    return;
  }

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.enableCors({
    origin: true, // allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  //in production
  //   origin: [
  //   'https://your-frontend.vercel.app',
  //   'http://localhost:5173'
  // ]
  await app.init();

  appInitialized = true;
}

export default async function handler(req: Request, res: Response) {
  await bootstrapServer();
  return server(req, res);
}
