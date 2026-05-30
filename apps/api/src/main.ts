import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const port = Number(process.env.PORT || 3001);

  app.enableCors({
    origin: [frontendUrl],
    credentials: true,
  });

  await app.listen(port, '0.0.0.0');
  console.log(`API corriendo en puerto ${port}`);
}

bootstrap();