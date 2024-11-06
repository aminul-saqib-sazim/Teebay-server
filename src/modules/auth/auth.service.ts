import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import { EntityManager } from "@mikro-orm/core";

import * as argon2 from "argon2";

import { ARGON2_OPTIONS } from "@/common/config/argon2.config";
import { User } from "@/common/entities/users.entity";
import {
  EVerificationRequestStatus,
  EVerificationRequestType,
} from "@/common/enums/verification-requests.enums";
import { RolesService } from "@/modules/roles/roles.service";
import { UsersService } from "@/modules/users/users.service";

import { EmailsService } from "../emails/emails.service";
import { VerificationRequestsService } from "../verification-requests/verification-requests.service";
import {
  INVALID_USER_CREDENTIALS,
  RESET_PASSWORD_TOKEN_EXPIRATION_DURATION_IN_MINUTES,
} from "./auth.constants";
import { IJwtPayload } from "./auth.interfaces";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly rolesService: RolesService,
    private readonly verificationRequestsService: VerificationRequestsService,
    private readonly configService: ConfigService,
    private readonly emailsService: EmailsService,
    private readonly em: EntityManager,
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

  async sendForgotPasswordEmail(email: string) {
    const user = await this.usersService.findByEmailOrThrow(email);

    const resetPasswordVerificationRequest =
      await this.verificationRequestsService.getVerificationRequest(
        user,
        EVerificationRequestType.RESET_PASSWORD,
        RESET_PASSWORD_TOKEN_EXPIRATION_DURATION_IN_MINUTES,
      );

    const resetPasswordLink = new URL(
      `/reset-password?token=${resetPasswordVerificationRequest.token}`,
      this.configService.getOrThrow("APP_BASE_URL"),
    );

    return this.emailsService.sendEmailByTextOrHtml({
      to: user.email,
      subject: "Reset Password",
      text: `Click the link to reset your password: ${resetPasswordLink}`,
      html: `Click the link to reset your password: <a href="${resetPasswordLink}">${resetPasswordLink}</a>`,
    });
  }

  async resetPasswordByToken(token: string, newPassword: string) {
    const verificationRequest =
      await this.verificationRequestsService.findOneOrFailVerificationRequest(
        token,
        EVerificationRequestType.RESET_PASSWORD,
      );

    if (!verificationRequest.user) throw new NotFoundException("Invalid Token, Please try again");

    verificationRequest.status = EVerificationRequestStatus.EXPIRED;

    const updatedUser = await this.usersService.updatePassword(
      verificationRequest.user.id,
      newPassword,
      verificationRequest.user.userProfile.role,
    );

    await this.em.flush();

    return updatedUser;
  }
}
