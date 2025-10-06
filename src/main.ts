import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    app.use('/payments/webhook', express.raw({ type: '*/*' }));
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.enableCors({
      origin: 'http://localhost:5173',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    await app.listen(3000);
    console.log('NestJS server running on http://localhost:3000 ');
  } catch (err) {
    console.error('Error starting NestJS:', err);
  }
}
bootstrap();
