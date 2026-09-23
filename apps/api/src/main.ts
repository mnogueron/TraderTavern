import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerDocumentOptions,
} from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { writeFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { apiReference } from '@scalar/nestjs-api-reference';
import * as path from 'node:path';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN,
      credentials: true,
    },
  });

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Always mounted under /api — kept constant regardless of domain mode
  // because the generated API client's paths are frozen with this prefix
  // at generation time. Same-domain deployments reach it via a relative
  // /api URL; own-domain deployments (API_DOMAIN set) reach it via
  // https://<API_DOMAIN>/api.
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('TraderTavern API')
    .setDescription('The TraderTavern API documentation')
    .setVersion('0.1')
    .build();

  const options: SwaggerDocumentOptions = {
    operationIdFactory: (_controllerKey: string, methodKey: string) =>
      methodKey,
  };

  const document = SwaggerModule.createDocument(app, config, options);

  writeFileSync(
    path.resolve('packages/api-client', 'openapi.yaml'),
    yaml.dump(document, { noRefs: true }),
  );

  SwaggerModule.setup('api-json', app, document);

  app.use('/docs', apiReference({ spec: { content: document } }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}}`);
}

bootstrap();
