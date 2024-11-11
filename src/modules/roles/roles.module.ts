import { Module } from "@nestjs/common";

import { MikroOrmModule } from "@mikro-orm/nestjs";

import { Role } from "@/common/entities/roles.entity";

import { RolesController } from "./roles.controller";
import { RolesSerializer } from "./roles.serializer";
import { RolesService } from "./roles.service";

@Module({
  imports: [MikroOrmModule.forFeature([Role])],
  controllers: [RolesController],
  providers: [RolesService, RolesSerializer],
  exports: [RolesService, MikroOrmModule.forFeature([Role])],
})
export class RolesModule {}
