import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { ITokenizedUser } from "@/modules/auth/auth.interfaces";

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): ITokenizedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
