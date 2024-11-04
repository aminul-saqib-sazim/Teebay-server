import { Injectable } from "@nestjs/common";

import { RolesRepository } from "./roles.repository";

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  findByIdOrThrow(id: number) {
    return this.rolesRepository.findOneOrFail(id, {
      populate: ["permissions"],
    });
  }
}
