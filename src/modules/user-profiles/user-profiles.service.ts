import { Injectable } from "@nestjs/common";

import { EntityManager } from "@mikro-orm/postgresql";

import { UserProfileUpdateDto } from "./user-profiles.dtos";
import { UserProfilesRepository } from "./user-profiles.repository";

@Injectable()
export class UserProfilesService {
  constructor(
    private readonly userProfilesRepository: UserProfilesRepository,
    private readonly em: EntityManager,
  ) {}

  async updateUserProfile(userId: number, body: UserProfileUpdateDto) {
    const userProfile = await this.userProfilesRepository.findOneOrFail({
      user: {
        id: userId,
      },
    });

    this.em.assign(userProfile, body);

    await this.em.flush();

    return userProfile;
  }
}
