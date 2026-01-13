import type { IEmailService } from "@/modules/emails/email-service.interface";

import type { IInvitationEmailData, IUserEmailData } from "./auth.interfaces";

export function createAuthEmailSenders(emailService: IEmailService, webClientBaseUrl: string) {
  return {
    async sendResetPasswordEmail(user: IUserEmailData, token: string): Promise<void> {
      const frontendResetUrl = `${webClientBaseUrl}/reset-password?token=${token}`;

      await emailService.sendEmailByTextOrHtml({
        to: user.email,
        subject: "Reset Your Password",
        html: `
          <h1>Reset Your Password</h1>
          <p>Hi ${user.name || "there"},</p>
          <p>You requested to reset your password. Click the link below to set a new password:</p>
          <p><a href="${frontendResetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        `,
      });
    },

    async sendVerificationEmail(user: IUserEmailData, token: string): Promise<void> {
      const frontendVerifyUrl = `${webClientBaseUrl}/verify?token=${token}`;

      await emailService.sendEmailByTextOrHtml({
        to: user.email,
        subject: "Verify Your Email Address",
        html: `
          <h1>Verify Your Email</h1>
          <p>Hi ${user.name || "there"},</p>
          <p>Thanks for signing up! Please verify your email address by clicking the link below:</p>
          <p><a href="${frontendVerifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Verify Email</a></p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        `,
      });
    },

    async sendInvitationEmail(data: IInvitationEmailData): Promise<void> {
      const { email, inviter, organization: org } = data;
      const inviteUrl = `${webClientBaseUrl}/invite/accept?token=${data.id}`;

      await emailService.sendEmailByTextOrHtml({
        to: email,
        subject: `You've been invited to join ${org.name}`,
        html: `
          <h1>You're Invited!</h1>
          <p>Hi there,</p>
          <p><strong>${
            inviter.user.name || inviter.user.email
          }</strong> has invited you to join <strong>${org.name}</strong>.</p>
          <p>Click the link below to accept the invitation:</p>
          <p><a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
          <p>If you don't want to join, you can safely ignore this email.</p>
        `,
      });
    },
  };
}
