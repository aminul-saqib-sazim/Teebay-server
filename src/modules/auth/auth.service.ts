import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import * as argon2 from "argon2";

import { ARGON2_OPTIONS } from "@/common/config/argon2.config";
import { User } from "@/common/entities/users.entity";
import { RolesService } from "@/modules/roles/roles.service";
import { UsersService } from "@/modules/users/users.service";

import { INVALID_USER_CREDENTIALS } from "./auth.constants";
import { IJwtPayload } from "./auth.interfaces";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly rolesService: RolesService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmailOrThrow(email);

    const verified = await argon2.verify(user.password as string, password, ARGON2_OPTIONS);
    if (!verified) throw new UnauthorizedException(INVALID_USER_CREDENTIALS);

    if (!user.userProfile) throw new UnauthorizedException(INVALID_USER_CREDENTIALS);

    return user;
  }

  checkUserExists(id: number) {
    return this.usersService.findByIdOrThrow(id);
  }

  checkUserClaimByRole(claimId: number) {
    return this.rolesService.findByIdOrThrow(claimId);
  }

  async createAccessToken(loggedInUser: User): Promise<string> {
    const user = await this.usersService.findByEmailOrThrow(loggedInUser.email);

    if (!user.userProfile) throw new UnauthorizedException(INVALID_USER_CREDENTIALS);

    const payload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      claimId: user.userProfile.role.id,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return accessToken;
  }
}
