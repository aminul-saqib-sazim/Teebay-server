import type { MiddlewareConsumer } from "@nestjs/common";
import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";

import { MikroOrmModule } from "@mikro-orm/nestjs";

import { OpenTelemetryModule } from "@metinseylan/nestjs-opentelemetry";

import { AuditLoggingModule } from "./common/audit-logging/audit-logging.module";
import { AuditLoggingSubscriber } from "./common/audit-logging/audit-logging.subscriber";
import { SessionGuard } from "./common/guards/session.guard";
import { AppLoggerMiddleware } from "./common/middleware/request-logger.middleware";
import { SkipBodyParsingForAuthMiddleware } from "./common/middleware/skip-body-parsing-for-auth.middleware";
import { validate } from "./common/validators/env.validator";
import ormConfig from "./db/db.config";
import { AuthModule } from "./modules/auth/auth.module";
import { DocumentSigningModule } from "./modules/document-signing/document-signing.module";
import { EmailsModule } from "./modules/emails/emails.module";
import { FileUploadsModule } from "./modules/file-uploads/file-uploads.module";
import { HealthModule } from "./modules/health/health.module";
import { MembersModule } from "./modules/members/members.module";
import { PdfGenerationModule } from "./modules/pdf-generation/pdf-generation.module";
import { PermissionsModule } from "./modules/permissions/permissions.module";
import { ProductsModule } from "./modules/products/products.module";
import { RolesModule } from "./modules/roles/roles.module";
import { UsersModule } from "./modules/users/users.module";
import { WebsocketExampleModule } from "./modules/websocket-example/websocket-example.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: false,
      isGlobal: true,
      validate,
    }),

    MikroOrmModule.forRootAsync({
      imports: [AuditLoggingModule],
      useFactory: (auditLoggingSubscriber: AuditLoggingSubscriber) => ({
        ...ormConfig,
        subscribers: [auditLoggingSubscriber],
      }),
      inject: [AuditLoggingSubscriber],
    }),

    OpenTelemetryModule.forRoot({
      serviceName: "Project Backend",
    }),

    EmailsModule,

    AuditLoggingModule,

    AuthModule,
    UsersModule,
    MembersModule,
    RolesModule,
    PermissionsModule,
    FileUploadsModule,
    WebsocketExampleModule,
    HealthModule,
    PdfGenerationModule,
    DocumentSigningModule,
    ProductsModule,
  ],
  controllers: [],
  providers: [
    Logger,
    {
      provide: APP_GUARD,
      useClass: SessionGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SkipBodyParsingForAuthMiddleware).forRoutes("*");
    consumer.apply(AppLoggerMiddleware).forRoutes("*");
  }
}
