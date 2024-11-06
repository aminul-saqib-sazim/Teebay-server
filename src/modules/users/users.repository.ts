import { Injectable } from "@nestjs/common";

import { Role } from "@/common/entities/roles.entity";
import { UserProfile } from "@/common/entities/user-profiles.entity";
import { CustomSQLBaseRepository } from "@/common/repository/custom-sql-base.repository";

import { User } from "../../common/entities/users.entity";
import { RegisterUserDto, UpdateUserDto } from "./users.dtos";

@Injectable()
export class UsersRepository extends CustomSQLBaseRepository<User> {
  createOne(registerUserDto: RegisterUserDto, role: Role) {
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
}
