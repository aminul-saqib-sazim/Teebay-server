import { UseInterceptors, Controller, Post, Param, ParseEnumPipe, Query } from "@nestjs/common";

import { EVerificationRequestType } from "@/common/enums/verification-requests.enums";
import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";

import { VerifyByTokenResponse } from "./verification-requests.dtos";
import { VerificationRequestsService } from "./verification-requests.service";

@UseInterceptors(ResponseTransformInterceptor)
@Controller("verification-requests")
export class VerificationRequestsController {
  constructor(private readonly verificationRequestsService: VerificationRequestsService) {}

  @Post("verify/:token")
  async verify(
    @Param("token") token: string,
    @Query("type", new ParseEnumPipe(EVerificationRequestType))
    type: EVerificationRequestType,
  ): Promise<VerifyByTokenResponse> {
    await this.verificationRequestsService.verifyByTokenAndType(token, type);

    return { message: "Verification successful" };
  }
}
