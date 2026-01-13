import { Injectable, NotFoundException } from "@nestjs/common";

import { EntityManager } from "@mikro-orm/core";

import type { UpdateMemberRoleDto } from "./members.dtos";
import type { IUpdateMemberRoleResponse } from "./members.interface";
import { MembersRepository } from "./members.repository";

@Injectable()
export class MembersService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly em: EntityManager,
  ) {}

  async updateMemberRole(
    dto: UpdateMemberRoleDto,
    organizationId: string,
  ): Promise<IUpdateMemberRoleResponse> {
    const member = await this.membersRepository.updateRole(dto.userId, organizationId, dto.role);

    if (!member) {
      throw new NotFoundException("Member not found in this organization");
    }

    await this.em.flush();

    return {
      success: true,
      message: `Role updated to ${dto.role} for ${member.user.email}`,
    };
  }
}
