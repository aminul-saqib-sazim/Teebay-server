import { BadRequestException, Injectable } from "@nestjs/common";

import { EntityManager } from "@mikro-orm/core";

import * as argon2 from "argon2";

import { ARGON2_OPTIONS } from "@/common/config/argon2.config";
import { Role } from "@/common/entities/roles.entity";

import { RolesRepository } from "../roles/roles.repository";
import { RegisterUserDto } from "./users.dtos";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly usersRepository: UsersRepository,
    private readonly rolesRepository: RolesRepository,
  ) {}

  private hashPassword(password: string) {
    return argon2.hash(password, ARGON2_OPTIONS);
  }

  async findByIdOrThrow(id: number) {
    const user = await this.usersRepository.findOneOrFail(id, {
      populate: ["userProfile", "userProfile.role"],
    });
    return user;
  }

  async findByEmailOrThrow(email: string) {
    const user = await this.usersRepository.findOneOrFail(
      {
        email,
      },
      {
        populate: ["userProfile", "userProfile.role"],
      },
    );
    return user;
  }

  async createOne(registerUserDto: RegisterUserDto) {
    const existingUser = await this.usersRepository.findOne({
      email: registerUserDto.email,
    });

    if (existingUser) {
      throw new BadRequestException("User already exists");
    }

    const role = await this.rolesRepository.findOneOrFail({
      id: registerUserDto.userProfile.roleId,
    });

    const newUser = this.usersRepository.createOne(
      {
        ...registerUserDto,
        password: await this.hashPassword(registerUserDto.password),
      },
      role,
    );

    await this.entityManager.flush();

    return newUser;
  }

  async updatePassword(userId: number, password: string, role: Role) {
    const user = await this.usersRepository.findOneOrFail({
      id: userId,
      userProfile: { role },
    });

    return this.usersRepository.update(user, { password: await this.hashPassword(password) });
  }
}
