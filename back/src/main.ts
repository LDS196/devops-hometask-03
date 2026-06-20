import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigin = (config.get<string>('CORS_ORIGIN') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigin });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Todo API')
    .setDescription('Single-user todolist REST API')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document, {
    jsonDocumentUrl: 'swagger-json',
  });

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
  console.log(`Listening on http://localhost:${port}`);
}
bootstrap();
