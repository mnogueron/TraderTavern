/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
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

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  //const globalPrefix = 'api';
  //app.setGlobalPrefix(globalPrefix);

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

  app.use('/api', apiReference({ spec: { content: document } }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}}`);
}

bootstrap();
