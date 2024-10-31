import { Logger, MiddlewareConsumer, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { MikroOrmModule } from "@mikro-orm/nestjs";

import { OpenTelemetryModule } from "@metinseylan/nestjs-opentelemetry";

import { AuthModule } from "./auth/auth.module";
import { AppLoggerMiddleware } from "./common/middleware/request-logger.middleware";
import { validate } from "./common/validators/env.validator";
import ormConfig from "./db/db.config";
import { DocumentSigningModule } from "./document-signing/document-signing.module";
import { FileUploadsModule } from "./file-uploads/file-uploads.module";
import { HealthModule } from "./health/health.module";
import { PdfGenerationModule } from "./pdf-generation/pdf-generation.module";
import { RolesModule } from "./roles/roles.module";
import { UserProfilesModule } from "./user-profiles/user-profiles.module";
import { UsersModule } from "./users/users.module";
import { WebsocketExampleModule } from "./websocket-example/websocket-example.module";

@Module({
  imports: [
    MikroOrmModule.forRoot(ormConfig),

    ConfigModule.forRoot({
      ignoreEnvFile: false,
      isGlobal: true,
      validate,
    }),

    OpenTelemetryModule.forRoot({
      serviceName: "Project Backend",
    }),

    UsersModule,
    AuthModule,
    RolesModule,
    FileUploadsModule,
    WebsocketExampleModule,
    UserProfilesModule,
    HealthModule,
    PdfGenerationModule,
    DocumentSigningModule,
  ],
  controllers: [],
  providers: [Logger],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes("*");
  }
}
