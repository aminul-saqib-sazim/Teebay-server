import { BadRequestException, Injectable } from "@nestjs/common";

import dayjs from "dayjs";

import { User } from "@/common/entities/users.entity";
import {
  EVerificationRequestStatus,
  EVerificationRequestType,
} from "@/common/enums/verification-requests.enums";
import { generateSecureHex } from "@/utils/crypto-helper";

import { EXPIRED_TOKEN_ERROR_MESSAGE } from "./verification-requests.constants";
import { VerificationRequestsRepository } from "./verification-requests.repository";

@Injectable()
export class VerificationRequestsService {
  constructor(private readonly verificationRequestsRepository: VerificationRequestsRepository) {}

  async getVerificationRequest(
    user: User,
    type: EVerificationRequestType,
    expiryDurationInMinutes: number,
  ) {
    const em = this.verificationRequestsRepository.getEntityManager();

    const latestVerificationRequest = await this.verificationRequestsRepository.findOne(
      {
        user,
        status: EVerificationRequestStatus.ACTIVE,
        type,
      },
      {
        orderBy: {
          createdAt: "DESC",
        },
      },
    );

    if (latestVerificationRequest && !latestVerificationRequest.isExpired()) {
      return latestVerificationRequest;
    } else {
      if (latestVerificationRequest?.status === EVerificationRequestStatus.ACTIVE) {
        latestVerificationRequest.status = EVerificationRequestStatus.EXPIRED;

        em.persist(latestVerificationRequest);
      }

      const verificationRequest = this.createAndPersistNewVerificationRequest(
        user,
        type,
        expiryDurationInMinutes,
      );

      await em.flush();

      return verificationRequest;
    }
  }

  createAndPersistNewVerificationRequest(
    user: User,
    type: EVerificationRequestType,
    expiryDurationInMinutes: number,
  ) {
    const em = this.verificationRequestsRepository.getEntityManager();

    const newVerificationRequest = this.verificationRequestsRepository.create({
      user,
      token: generateSecureHex(60),
      status: EVerificationRequestStatus.ACTIVE,
      type,
      expiresAt: dayjs().add(expiryDurationInMinutes, "minutes").toISOString(),
    });

    em.persist(newVerificationRequest);

    return newVerificationRequest;
  }

  async findOrFailVerificationRequest(token: string, type: EVerificationRequestType) {
    const verificationRequest = await this.verificationRequestsRepository.findOneOrFail(
      {
        token,
        type,
      },
      {
        populate: ["user", "user.userProfile", "user.userProfile.role"],
      },
    );

    if (verificationRequest.status === EVerificationRequestStatus.EXPIRED) {
      throw new BadRequestException(EXPIRED_TOKEN_ERROR_MESSAGE);
    } else if (verificationRequest.isExpired()) {
      if (verificationRequest.status === EVerificationRequestStatus.ACTIVE) {
        await this.verificationRequestsRepository.nativeUpdate(
          {
            id: verificationRequest.id,
          },
          {
            status: EVerificationRequestStatus.EXPIRED,
          },
        );
      }
      throw new BadRequestException(EXPIRED_TOKEN_ERROR_MESSAGE);
    }

    return verificationRequest;
  }
}
