import { Injectable } from "@nestjs/common";

import { UserProfilesRepository } from "./user-profiles.repository";

@Injectable()
export class UserProfilesService {
  constructor(private readonly userProfilesRepository: UserProfilesRepository) {}
}
