import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { EntityManager } from "@mikro-orm/core";

import type { Request } from "express";

import { IS_PUBLIC_KEY } from "@/common/decorators/auth/public.decorator";
import { Member } from "@/common/entities/members.entity";
import { Organization } from "@/common/entities/organizations.entity";
import { EUserRole } from "@/common/enums/roles.enums";
import { EUserState } from "@/common/enums/users.enums";
import { AuthService } from "@/modules/auth/auth.service";

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly em: EntityManager,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    try {
      const headers = new Headers();
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) {
          headers.set(key, Array.isArray(value) ? value[0] : value);
        }
      });

      const session = await this.authService.auth.api.getSession({
        headers,
      });

      if (!session) {
        throw new UnauthorizedException("No valid session found");
      }

      if (session.user.state === EUserState.INACTIVE) {
        throw new ForbiddenException(
          "Your account has been deactivated. Please contact an administrator.",
        );
      }

      const enrichedSession = { ...session, session: { ...session.session } };

      if (
        enrichedSession.session.activeOrganizationId &&
        !enrichedSession.session.activeOrganizationRole
      ) {
        const member = await this.em.findOne(Member, {
          user: session.user.id,
          organization: enrichedSession.session.activeOrganizationId,
        });

        if (member) {
          enrichedSession.session.activeOrganizationRole = member.role;
        } else {
          const defaultOrg = await this.em.findOne(Organization, {
            slug: "default-organization",
          });
          if (defaultOrg && enrichedSession.session.activeOrganizationId === defaultOrg.id) {
            enrichedSession.session.activeOrganizationRole = EUserRole.MEMBER;
          }
        }
      }

      (request as Request & { session: typeof enrichedSession }).session = enrichedSession;
      (request as Request & { user: typeof session.user }).user = session.user;

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid or expired session");
    }
  }
}
