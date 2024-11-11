import { Injectable } from "@nestjs/common";

import { QueryOrder } from "@mikro-orm/core";

import { Role } from "@/common/entities/roles.entity";
import { UserProfile } from "@/common/entities/user-profiles.entity";
import { CustomSQLBaseRepository } from "@/common/repository/custom-sql-base.repository";

import { User } from "../../common/entities/users.entity";
import {
  UpdateUserAsSuperuserDto,
  RegisterUserDto,
  SelfRegisterUserDto,
  UpdateUserDto,
  SuperuserFindAllUsersParams,
} from "./users.dtos";

@Injectable()
export class UsersRepository extends CustomSQLBaseRepository<User> {
  createOne(registerUserDto: RegisterUserDto | SelfRegisterUserDto, role: Role) {
    const {
      email,
      password,
      userProfile: { firstName, lastName },
    } = registerUserDto;

    const user = new User(email, password);
    const userProfile = new UserProfile(firstName, lastName);

    userProfile.role = role;
    user.userProfile = userProfile;
    userProfile.user = user;

    this.em.persist([user, userProfile]);

    return user;
  }

  update(user: User, updateUserDto: UpdateUserDto) {
    this.em.assign(user, updateUserDto);

    this.em.persist(user);

    return user;
  }

  updateAsSuperuser(
    user: User,
    updateUserAsSuperuserDto: UpdateUserAsSuperuserDto,
    updatedRole?: Role,
  ) {
    const { roleId: _, ...rest } = updateUserAsSuperuserDto;

    this.em.assign(user, rest);

    if (updatedRole) {
      user.userProfile.role = updatedRole;
    }

    this.em.persist(user);

    return user;
  }

  findAllPaginated(params: SuperuserFindAllUsersParams, currentUserId: number) {
    const { page, limit, state } = params;

    const qb = this.createQueryBuilder("u")
      .select("*")
      .leftJoinAndSelect("u.userProfile", "up")
      .leftJoinAndSelect("up.role", "r")
      .where({
        state,
        id: {
          $ne: currentUserId,
        },
      })
      .orderBy({
        createdAt: QueryOrder.DESC,
      });

    return this.retrievePaginatedRecordsByLimitAndOffset({ qb, page, limit });
  }
}
