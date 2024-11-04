import { Module } from "@nestjs/common";

import { MikroOrmModule } from "@mikro-orm/nestjs";

import { UserProfile } from "@/common/entities/user-profiles.entity";

import { UserProfilesSerializer } from "./user-profiles.serializer";
import { UserProfilesService } from "./user-profiles.service";

@Module({
  imports: [MikroOrmModule.forFeature([UserProfile])],
  controllers: [],
  providers: [UserProfilesService, UserProfilesSerializer],
  exports: [UserProfilesService, UserProfilesSerializer, MikroOrmModule.forFeature([UserProfile])],
})
export class UserProfilesModule {}
