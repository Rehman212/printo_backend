import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const http = app.getHttpAdapter().getInstance();
  http.set('trust proxy', 1);
  http.disable('x-powered-by');

  app.setGlobalPrefix('api');

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: false },
    }),
  );

  // Default Express body limit (100kb) is too small for scraped product
  // imports - a full pricing sweep JSON (attributes + every price row) can
  // run into several MB.
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));

  const frontendOrigins = [
    process.env.FRONTEND_URL,
    'https://printoe.com',
    'https://www.printoe.com',
    'https://editor.printoe.com',
    'https://main.d32vo9xr3dxlu3.amplifyapp.com',
    'https://main.dcxv58mlk9l5m.amplifyapp.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: frontendOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  console.log(`Printoe API running on http://localhost:${port}/api`);
}

bootstrap();
