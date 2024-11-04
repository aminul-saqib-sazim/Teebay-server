import { Module } from "@nestjs/common";

import { MikroOrmModule } from "@mikro-orm/nestjs";

import { Role } from "@/common/entities/roles.entity";

import { RolesService } from "./roles.service";

@Module({
  imports: [MikroOrmModule.forFeature([Role])],
  controllers: [],
  providers: [RolesService],
  exports: [RolesService, MikroOrmModule.forFeature([Role])],
})
export class RolesModule {}
