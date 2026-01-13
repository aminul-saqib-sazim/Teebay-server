import type { FilterQuery } from "@mikro-orm/core";

import { User } from "@/common/entities/users.entity";
import { CustomSQLBaseRepository } from "@/common/repository/custom-sql-base.repository";

import type { IFindUsersOptions } from "./users.interface";

export class UsersRepository extends CustomSQLBaseRepository<User> {
  async findById(id: string): Promise<User | null> {
    return this.findOne({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async findAllPaginated(options: IFindUsersOptions): Promise<{ users: User[]; total: number }> {
    const { page, limit, search, state, organizationId } = options;
    const offset = (page - 1) * limit;

    const where: FilterQuery<User> = {};

    if (state) {
      where.state = state;
    }

    if (search) {
      where.$or = [
        { email: { $like: `%${search}%` } },
        { firstName: { $like: `%${search}%` } },
        { lastName: { $like: `%${search}%` } },
        { name: { $like: `%${search}%` } },
      ];
    }

    if (organizationId) {
      where.memberships = { organization: { id: organizationId } };
    }

    const [users, total] = await this.em.findAndCount(User, where, {
      limit,
      offset,
      orderBy: { createdAt: "DESC" },
    });

    return { users, total };
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }
    this.em.assign(user, data);
    return user;
  }
}
