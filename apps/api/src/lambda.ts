import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import type { IncomingMessage, ServerResponse } from 'http';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

let handler: Handler | null = null;

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');
  await app.init();

  return app.getHttpAdapter().getInstance() as Handler;
}

// Vercel serverless handler — reuses the app instance across warm invocations
export default async (req: IncomingMessage, res: ServerResponse) => {
  if (!handler) {
    handler = await bootstrap();
  }
  handler(req, res);
};
