import { Module } from "@nestjs/common";

import { EntityManager } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";

import { Member } from "@/common/entities/members.entity";

import { AuthModule } from "../auth/auth.module";
import { MembersController } from "./members.controller";
import { MembersRepository } from "./members.repository";
import { MembersService } from "./members.service";

@Module({
  imports: [MikroOrmModule.forFeature([Member]), AuthModule],
  controllers: [MembersController],
  providers: [
    MembersService,
    {
      provide: MembersRepository,
      useFactory: (em: EntityManager) => em.getRepository(Member),
      inject: [EntityManager],
    },
  ],
  exports: [MembersService],
})
export class MembersModule {}
