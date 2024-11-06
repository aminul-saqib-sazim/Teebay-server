import { Module } from "@nestjs/common";

import { MikroOrmModule } from "@mikro-orm/nestjs";

import { VerificationRequest } from "@/common/entities/verification-requests.entity";

import { UserProfilesModule } from "../user-profiles/user-profiles.module";
import { VerificationRequestsSerializer } from "./verification-requests.serializer";
import { VerificationRequestsService } from "./verification-requests.service";

@Module({
  imports: [MikroOrmModule.forFeature([VerificationRequest]), UserProfilesModule],
  controllers: [],
  providers: [VerificationRequestsService, VerificationRequestsSerializer],
  exports: [
    VerificationRequestsService,
    VerificationRequestsSerializer,
    MikroOrmModule.forFeature([VerificationRequest]),
  ],
})
export class VerificationRequestsModule {}
