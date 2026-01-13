import { Body, Controller, Post, UseInterceptors, HttpStatus, HttpCode } from "@nestjs/common";

import { Public } from "@/common/decorators/auth/public.decorator";
import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";

import { DocumentSigningService } from "./document-signing.service";
import { type TDocusealWebhookPayload } from "./document-signing.types";

@UseInterceptors(ResponseTransformInterceptor)
@Controller("document-signing")
export class DocumentSigningController {
  constructor(private readonly documentSigningService: DocumentSigningService) {}

  @Public()
  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() payload: TDocusealWebhookPayload) {
    return this.documentSigningService.handleWebhook(payload);
  }
}
