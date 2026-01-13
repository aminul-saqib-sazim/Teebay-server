import { Module } from "@nestjs/common";

import { EntityManager } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";

import { User } from "@/common/entities/users.entity";

import { AuthModule } from "../auth/auth.module";
import { UsersController } from "./users.controller";
import { UsersRepository } from "./users.repository";
import { UsersService } from "./users.service";

@Module({
  imports: [MikroOrmModule.forFeature([User]), AuthModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: UsersRepository,
      useFactory: (em: EntityManager) => em.getRepository(User),
      inject: [EntityManager],
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
