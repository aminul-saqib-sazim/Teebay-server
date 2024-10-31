import { ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder, SwaggerDocumentOptions } from "@nestjs/swagger";

import helmet from "helmet";
import { WinstonModule } from "nest-winston";

import { AppModule } from "./app.module";
import { getAllowedMethods, getCorsConfig } from "./common/config/cors.config";
import getWinstonLoggerTransports from "./utils/logger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: getWinstonLoggerTransports(),
    }),
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
    prefix: "api/v",
  });
  app.enableCors({
    methods: getAllowedMethods(),
    ...getCorsConfig(),
  });

  app.use(helmet());

  if (process.env.STAGE_ENV === "local") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Project API")
      .setDescription("The BE API for Project")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const documentOptions: SwaggerDocumentOptions = {
      ignoreGlobalPrefix: true,
      operationIdFactory: (_: string, methodKey: string) => methodKey,
    };
    const document = SwaggerModule.createDocument(app, swaggerConfig, documentOptions);
    SwaggerModule.setup("swagger", app, document);
  }

  app.enableShutdownHooks();

  await app.listen(process.env.BE_PORT);
}
bootstrap();
