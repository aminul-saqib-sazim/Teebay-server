import { Injectable, UnauthorizedException } from "@nestjs/common";

import { EntityManager } from "@mikro-orm/postgresql";

import * as argon2 from "argon2";

import { ARGON2_OPTIONS } from "@/common/config/argon2.config";

import { INVALID_USER_CREDENTIALS } from "../auth/auth.constants";
import { UpdateUserProfileDto } from "./user-profiles.dtos";
import { UserProfilesRepository } from "./user-profiles.repository";

@Injectable()
export class UserProfilesService {
  constructor(
    private readonly userProfilesRepository: UserProfilesRepository,
    private readonly em: EntityManager,
  ) {}

  async updateUserProfile(userId: number, body: UpdateUserProfileDto) {
    const userProfile = await this.userProfilesRepository.findOneOrFail(
      {
        user: {
          id: userId,
        },
      },
      {
        populate: ["user"],
      },
    );

    const { password } = body;

    const verified = await argon2.verify(
      userProfile.user.password as string,
      password,
      ARGON2_OPTIONS,
    );
    if (!verified) throw new UnauthorizedException(INVALID_USER_CREDENTIALS);

    const { password: _, ...rest } = body;

    this.em.assign(userProfile, rest);

    await this.em.flush();

    return userProfile;
  }

  getUserProfile(userId: number) {
    return this.userProfilesRepository.findOneOrFail(
      {
        user: {
          id: userId,
        },
      },
      {
        populate: ["role"],
      },
    );
  }
}
