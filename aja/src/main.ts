import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function hermes() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 2323);
}
hermes();
