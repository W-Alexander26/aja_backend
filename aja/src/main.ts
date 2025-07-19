import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cargar variables de entorno desde ConfigService
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  app.useGlobalPipes(new ValidationPipe());

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  await app.listen(port);
  console.log(`🚀 App corriendo en http://localhost:${port}/api`);
}
bootstrap();
