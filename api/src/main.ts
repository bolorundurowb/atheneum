import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import configuration from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // configure CORS
  app.enableCors();

  // configure swagger
  const options = new DocumentBuilder()
    .setTitle('Atheneum API')
    .setDescription('The API for the atheneum app')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  // configure validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );

  await app.listen(configuration().port);
}

bootstrap().then(() => console.log('API bootstrapped'));
