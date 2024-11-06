import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import sgMail from "@sendgrid/mail";

import { SEND_FROM_EMAIL } from "./emails.constants";

@Injectable()
export class EmailsService {
  private readonly logger = new Logger();

  constructor(private readonly configService: ConfigService) {
    const sendGridApiKey = this.configService.getOrThrow<string>("SENDGRID_API_KEY");
    sgMail.setApiKey(sendGridApiKey);
  }

  async sendEmail({
    to,
    templateId,
    templateData,
  }: {
    to: string;
    templateId: string;
    templateData?: Record<string, unknown>;
  }): Promise<void> {
    let mailData: { to: string; from: string; templateId: string; dynamicTemplateData?: object } = {
      to,
      from: SEND_FROM_EMAIL,
      templateId,
    };

    if (templateData && Object.keys(templateData).length > 0) {
      mailData = { ...mailData, dynamicTemplateData: { ...templateData } };
    }

    try {
      await sgMail.send(mailData);
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}. Error occurred: ${error}`, error);
    }
  }
}
