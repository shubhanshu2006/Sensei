import nodemailer from "nodemailer";
import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  interviewInvitationTemplate,
  type InterviewInvitationData,
} from "./templates/interview-invitation.js";
import {
  interviewCompleteTemplate,
  type InterviewCompleteData,
} from "./templates/interview-complete.js";
import {
  paymentConfirmationTemplate,
  type PaymentConfirmationData,
} from "./templates/payment-confirmation.js";

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromAddress: string;

  constructor() {
    // Configure Brevo SMTP
    this.transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: config.brevo.apiUser,
        pass: config.brevo.apiKey,
      },
    });

    this.fromAddress = config.brevo.fromEmail || "noreply@sensei.ai";

    logger.info("[EmailService] Initialized with Brevo SMTP");
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: `"Sensei AI" <${this.fromAddress}>`,
        to: options.to,
        subject: options.subject,
        text: options.textBody || this.stripHtml(options.htmlBody),
        html: options.htmlBody,
      });

      logger.info("[EmailService] Email sent", {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      });
    } catch (error) {
      logger.error("[EmailService] Failed to send email", {
        error,
        to: options.to,
      });
      throw new ApiError(500, "Failed to send email");
    }
  }

  async sendInterviewInvitation(input: {
    candidateEmail: string;
    candidateName: string;
    jobTitle: string;
    companyName: string;
    interviewLink: string;
  }): Promise<void> {
    const templateData: InterviewInvitationData = {
      candidateName: input.candidateName,
      jobTitle: input.jobTitle,
      companyName: input.companyName,
      interviewLink: input.interviewLink,
      scheduledTime: "At your convenience", // Can be dynamic
    };

    const { subject, htmlBody, textBody } =
      interviewInvitationTemplate(templateData);

    await this.sendEmail({
      to: input.candidateEmail,
      subject,
      htmlBody,
      textBody,
    });
  }

  async sendInterviewCompleted(input: {
    candidateEmail: string;
    candidateName: string;
    jobTitle: string;
    resultsLink: string;
  }): Promise<void> {
    const templateData: InterviewCompleteData = {
      candidateName: input.candidateName,
      jobTitle: input.jobTitle,
      resultsLink: input.resultsLink,
      interviewType: "HIRING", // Can be dynamic based on session type
    };

    const { subject, htmlBody, textBody } =
      interviewCompleteTemplate(templateData);

    await this.sendEmail({
      to: input.candidateEmail,
      subject,
      htmlBody,
      textBody,
    });
  }

  async sendPaymentConfirmation(input: {
    recruiterEmail: string;
    recruiterName: string;
    credits: number;
    amountPaid: number;
  }): Promise<void> {
    const templateData: PaymentConfirmationData = {
      recruiterName: input.recruiterName,
      credits: input.credits,
      amountPaid: input.amountPaid,
      orderId: `ORD-${Date.now()}`, // Should come from Razorpay
      paymentId: `PAY-${Date.now()}`, // Should come from Razorpay
      newBalance: input.credits, // Should query actual balance
      transactionDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };

    const { subject, htmlBody, textBody } =
      paymentConfirmationTemplate(templateData);

    await this.sendEmail({
      to: input.recruiterEmail,
      subject,
      htmlBody,
      textBody,
    });
  }

  async sendCreditLowWarning(input: {
    recruiterEmail: string;
    recruiterName: string;
    creditsRemaining: number;
  }): Promise<void> {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Credits Running Low</h2>
        <p>Hi ${input.recruiterName},</p>
        <p>Your Sensei AI credit balance is running low. You have <strong>${input.creditsRemaining} credits</strong> remaining.</p>
        <p>To continue conducting interviews without interruption, we recommend purchasing more credits.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://app.sensei.ai/recruiter/credits" style="background-color: #4F46E5; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Purchase Credits
          </a>
        </div>
        <p>The Sensei AI Team</p>
      </div>
    `;

    await this.sendEmail({
      to: input.recruiterEmail,
      subject: `Credit Balance Low - ${input.creditsRemaining} Credits Remaining`,
      htmlBody,
    });
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
}

export const emailService = new EmailService();
