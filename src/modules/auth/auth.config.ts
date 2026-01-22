import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { bearer, organization } from "better-auth/plugins";

import { Member } from "@/common/entities/members.entity";
import { Organization } from "@/common/entities/organizations.entity";
import { User } from "@/common/entities/users.entity";
import { EUserState } from "@/common/enums/users.enums";
import { ac, admin, member, owner } from "@/modules/permissions/permissions.constants";

import { mikroOrmAdapter } from "./adapters/mikro-orm.adapter";
import { BETTER_AUTH_BASE_PATH } from "./auth.constants";
import { createAuthEmailSenders } from "./auth.helpers";
import type { IBetterAuthInstance, ICreateBetterAuthInstanceOptions } from "./auth.interfaces";

export function createAuthInstance({
  orm,
  emailService,
}: ICreateBetterAuthInstanceOptions): IBetterAuthInstance {
  const webClientBaseUrl = process.env.WEB_CLIENT_BASE_URL;
  const emailSenders = createAuthEmailSenders(emailService, webClientBaseUrl);

  return betterAuth({
    database: mikroOrmAdapter(orm),

    baseURL: process.env.API_BASE_URL,
    basePath: BETTER_AUTH_BASE_PATH,

    trustedOrigins: [webClientBaseUrl],

    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, token }) => {
        await emailSenders.sendResetPasswordEmail(user, token);
      },
    },

    emailVerification: {
      sendOnSignUp: false,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, token }) => {
        await emailSenders.sendVerificationEmail(user, token);
      },
    },

    user: {
      additionalFields: {
        firstName: {
          type: "string",
          required: true,
          input: true,
        },
        lastName: {
          type: "string",
          required: true,
          input: true,
        },
        state: {
          type: "string",
          required: false,
          defaultValue: "ACTIVE",
          input: false,
        },
        firstLoginAt: {
          type: "date",
          required: false,
          input: false,
        },
      },
    },

    session: {
      expiresIn: Number(process.env.SESSION_EXPIRES_IN),
      updateAge: Number(process.env.SESSION_UPDATE_AGE),
    },

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        mapProfileToUser: (profile) => {
          const nameParts = (profile.name || "").split(" ");
          const firstName = nameParts[0] || profile.given_name || "";
          const lastName = nameParts.slice(1).join(" ") || profile.family_name || "";

          return {
            firstName,
            lastName,
          };
        },
      },
    },

    plugins: [
      bearer(),
      organization({
        ac,
        roles: {
          owner,
          admin,
          member,
        },
        allowUserToCreateOrganization: true,
        sendInvitationEmail: emailSenders.sendInvitationEmail,
      }),
    ],

    logger: {
      level: "error",
    },

    advanced: {
      database: { generateId: false },
    },

    hooks: {
      // eslint-disable-next-line require-await
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path.startsWith("/callback")) {
          const newSession = ctx.context.newSession;
          if (newSession?.session?.token) {
            const token = newSession.session.token;
            const callbackURL = `${webClientBaseUrl}/auth/callback`;
            const separator = callbackURL.includes("?") ? "&" : "?";
            throw ctx.redirect(`${callbackURL}${separator}token=${token}`);
          }
        }
      }),
    },

    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const em = orm.em.fork();
            const user = await em.findOne(User, { id: session.userId });

            if (user?.state === EUserState.INACTIVE) {
              throw new APIError("FORBIDDEN", {
                message: "Your account has been deactivated. Please contact an administrator.",
              });
            }

            const member = await em.findOne(Member, { user: session.userId });
            if (member) {
              session.activeOrganizationId = member.organization.id;
            } else {
              const defaultOrg = await em.findOne(Organization, { slug: "default-organization" });
              if (defaultOrg) {
                session.activeOrganizationId = defaultOrg.id;
              }
            }

            return { data: session };
          },
        },
      },
    },
  });
}
