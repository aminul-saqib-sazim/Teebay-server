import { Injectable, NotFoundException } from "@nestjs/common";

import { EntityManager } from "@mikro-orm/core";

import type { User } from "@/common/entities/users.entity";
import { EUserRole } from "@/common/enums/roles.enums";

import { AuthService } from "../auth/auth.service";
import type {
  InviteUserDto,
  ListUsersQueryDto,
  UpdateProfileDto,
  UpdateUserDto,
} from "./users.dtos";
import type {
  IInviteUserResponse,
  IPaginatedUsersResponse,
  IUserResponse,
} from "./users.interface";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authService: AuthService,
    private readonly em: EntityManager,
  ) {}

  private toUserResponse(user: User): IUserResponse {
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      image: user.image,
      state: user.state,
      firstLoginAt: user.firstLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getCurrentUser(userId: string): Promise<IUserResponse> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.toUserResponse(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<IUserResponse> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const updateData: Partial<User> = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.image !== undefined) updateData.image = dto.image;

    if (dto.firstName || dto.lastName) {
      updateData.name = `${dto.firstName ?? user.firstName} ${dto.lastName ?? user.lastName}`;
    }

    const updatedUser = await this.usersRepository.update(userId, updateData);

    if (!updatedUser) {
      throw new NotFoundException("User not found");
    }

    await this.em.flush();
    return this.toUserResponse(updatedUser);
  }

  async listUsers(
    query: ListUsersQueryDto,
    organizationId: string,
  ): Promise<IPaginatedUsersResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const { users, total } = await this.usersRepository.findAllPaginated({
      page,
      limit,
      search: query.search,
      state: query.state,
      organizationId,
    });

    return {
      data: users.map((user) => this.toUserResponse(user)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUser(userId: string, dto: UpdateUserDto): Promise<IUserResponse> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const updateData: Partial<User> = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.image !== undefined) updateData.image = dto.image;
    if (dto.state !== undefined) updateData.state = dto.state;

    if (dto.firstName || dto.lastName) {
      updateData.name = `${dto.firstName ?? user.firstName} ${dto.lastName ?? user.lastName}`;
    }

    const updatedUser = await this.usersRepository.update(userId, updateData);

    if (!updatedUser) {
      throw new NotFoundException("User not found");
    }

    await this.em.flush();
    return this.toUserResponse(updatedUser);
  }

  async inviteUser(
    dto: InviteUserDto,
    organizationId: string,
    inviterHeaders: Headers,
  ): Promise<IInviteUserResponse> {
    try {
      await this.authService.auth.api.createInvitation({
        headers: inviterHeaders,
        body: {
          email: dto.email,
          role: dto.role ?? EUserRole.MEMBER,
          organizationId,
        },
      });

      return {
        success: true,
        message: `Invitation sent to ${dto.email}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send invitation";
      return {
        success: false,
        message,
      };
    }
  }
}
