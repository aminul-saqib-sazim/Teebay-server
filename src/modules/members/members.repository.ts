import type { Member } from "@/common/entities/members.entity";
import type { EUserRole } from "@/common/enums/roles.enums";
import { CustomSQLBaseRepository } from "@/common/repository/custom-sql-base.repository";

export class MembersRepository extends CustomSQLBaseRepository<Member> {
  async findByUserAndOrganization(userId: string, organizationId: string): Promise<Member | null> {
    return this.findOne(
      {
        user: { id: userId },
        organization: { id: organizationId },
      },
      { populate: ["user"] },
    );
  }

  async updateRole(
    userId: string,
    organizationId: string,
    role: EUserRole,
  ): Promise<Member | null> {
    const member = await this.findByUserAndOrganization(userId, organizationId);
    if (!member) {
      return null;
    }
    member.role = role;
    return member;
  }
}
