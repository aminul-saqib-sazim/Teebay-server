import type { MikroORM } from "@mikro-orm/core";

import type { EUserRole } from "@/common/enums/roles.enums";
import type { IEmailService } from "@/modules/emails/email-service.interface";

export interface IUserEmailData {
  email: string;
  name?: string | null;
}

export interface IInvitationEmailData {
  id: string;
  email: string;
  inviter: {
    user: {
      name?: string | null;
      email: string;
    };
  };
  organization: {
    name: string;
  };
}

export interface IBetterAuthInstance {
  handler: (request: Request) => Promise<Response>;
  api: {
    getSession: (options: { headers: Headers }) => Promise<{
      session: {
        id: string;
        token: string;
        userId: string;
        expiresAt: Date;
        createdAt: Date;
        updatedAt: Date;
        ipAddress?: string | null;
        userAgent?: string | null;
        activeOrganizationId?: string | null;
        activeOrganizationRole?: string | null;
      };
      user: {
        id: string;
        email: string;
        name: string;
        emailVerified: boolean;
        image?: string | null;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        state?: string | null;
        firstLoginAt?: Date | null;
      };
    } | null>;
    createInvitation: (options: {
      headers: Headers;
      body: {
        email: string;
        role: EUserRole | EUserRole[];
        organizationId?: string;
        resend?: boolean;
      };
    }) => Promise<{ id: string }>;
  };
}

export interface ICreateBetterAuthInstanceOptions {
  orm: MikroORM;
  emailService: IEmailService;
}
