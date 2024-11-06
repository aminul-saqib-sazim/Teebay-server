import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { EntityManager } from "@mikro-orm/core";

import * as argon2 from "argon2";

import { ARGON2_OPTIONS } from "@/common/config/argon2.config";
import { Role } from "@/common/entities/roles.entity";
import { EUserRole } from "@/common/enums/roles.enums";
import { EVerificationRequestType } from "@/common/enums/verification-requests.enums";

import { EmailsService } from "../emails/emails.service";
import { RolesRepository } from "../roles/roles.repository";
import { VerificationRequestsService } from "../verification-requests/verification-requests.service";
import { EMAIL_VERIFICATION_EMAIL_EXPIRATION_IN_MINUTES } from "./users.constants";
import { RegisterUserDto, SelfRegisterUserDto } from "./users.dtos";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly usersRepository: UsersRepository,
    private readonly rolesRepository: RolesRepository,
    private readonly verificationRequestsService: VerificationRequestsService,
    private readonly emailsService: EmailsService,
    private readonly configService: ConfigService,
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

  async selfRegister(selfRegisterUserDto: SelfRegisterUserDto, roleName = EUserRole.ADMIN) {
    const existingUser = await this.usersRepository.findOne({
      email: selfRegisterUserDto.email,
    });

    if (existingUser) {
      throw new BadRequestException("User already exists");
    }

    const role = await this.rolesRepository.findOneOrFail({
      name: roleName,
    });

    const newUser = this.usersRepository.createOne(
      {
        ...selfRegisterUserDto,
        password: await this.hashPassword(selfRegisterUserDto.password),
      },
      role,
    );

    const verificationRequest =
      this.verificationRequestsService.createAndPersistNewVerificationRequest(
        newUser,
        EVerificationRequestType.EMAIL_VERIFICATION,
        EMAIL_VERIFICATION_EMAIL_EXPIRATION_IN_MINUTES,
      );

    await this.entityManager.flush();

    const emailVerificationLink = new URL(
      `/verify?token=${verificationRequest.token}`,
      this.configService.getOrThrow("APP_BASE_URL"),
    );

    this.emailsService.sendEmailByTextOrHtml({
      to: newUser.email,
      subject: "Email Verification",
      text: `Click the link to verify your email: ${emailVerificationLink}`,
      html: `Click the link to verify your email: <a href="${emailVerificationLink}">${emailVerificationLink}</a>`,
    });

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
