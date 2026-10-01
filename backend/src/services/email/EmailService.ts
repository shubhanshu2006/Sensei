import SibApiV3Sdk from "sib-api-v3-sdk";
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
import {
  welcomeEmailTemplate,
  type WelcomeEmailData,
} from "./templates/welcome-email.js";

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export class EmailService {
  private apiInstance: any = null;
  private fromAddress: string;
  private fromName: string;

  constructor() {
    this.fromAddress = config.brevo.fromEmail || "no-reply@sensei.dev";
    this.fromName = config.brevo.fromName || "Sensei";

    if (config.brevo.apiKey) {
      try {
        const SibApi = (SibApiV3Sdk as any)?.default || SibApiV3Sdk;
        const defaultClient = SibApi.ApiClient.instance;

        // Configure API key authorization: api-key
        const apiKey = defaultClient.authentications["api-key"];
        apiKey.apiKey = config.brevo.apiKey;

        this.apiInstance = new SibApi.TransactionalEmailsApi();
        logger.info("[EmailService] Initialized with Brevo SibApiV3Sdk");
      } catch (clientErr) {
        logger.error("[EmailService] Failed to initialize SibApiV3Sdk", { error: clientErr });
      }
    } else {
      logger.warn("[EmailService] Brevo API key not provided in configuration");
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.apiInstance) {
      logger.error("[EmailService] Brevo API client is not configured");
      throw new ApiError(500, "Brevo email service is not configured");
    }

    try {
      const SibApi = (SibApiV3Sdk as any)?.default || SibApiV3Sdk;
      const sendSmtpEmail = new SibApi.SendSmtpEmail();

      sendSmtpEmail.subject = options.subject;
      sendSmtpEmail.htmlContent = options.htmlBody;
      sendSmtpEmail.textContent = options.textBody || this.stripHtml(options.htmlBody);
      sendSmtpEmail.sender = {
        name: this.fromName,
        email: this.fromAddress,
      };
      sendSmtpEmail.to = [
        {
          email: options.to,
          name: options.toName || options.to,
        },
      ];

      logger.info("[EmailService] Sending email via Brevo SibApiV3Sdk", {
        to: options.to,
        from: this.fromAddress,
        subject: options.subject,
      });

      const data = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      logger.info("[EmailService] Email sent successfully via Brevo SibApiV3Sdk", {
        to: options.to,
        subject: options.subject,
        messageId: data?.messageId,
      });
    } catch (error: any) {
      const errorDetail =
        error?.response?.body?.message ||
        error?.response?.body?.code ||
        error?.response?.text ||
        error?.message ||
        "Unknown error";

      logger.error("[EmailService] Brevo SibApiV3Sdk sending failed", {
        to: options.to,
        from: this.fromAddress,
        subject: options.subject,
        statusCode: error?.response?.statusCode || error?.status,
        errorDetail,
      });

      throw new ApiError(500, `Failed to send email via Brevo: ${errorDetail}`);
    }
  }

  async sendWelcomeEmail(input: {
    userEmail: string;
    userName?: string;
    dashboardLink?: string;
  }): Promise<void> {
    const { subject, htmlBody, textBody } = welcomeEmailTemplate({
      userEmail: input.userEmail,
      userName: input.userName,
      dashboardLink: input.dashboardLink,
    });

    await this.sendEmail({
      to: input.userEmail,
      toName: input.userName,
      subject,
      htmlBody,
      textBody,
    });
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

  async sendScreeningCompletedRecruiter(input: {
    recruiterEmail: string;
    recruiterName: string;
    candidateName: string;
    jobTitle: string;
    score: number;
    decision: string;
    applicationId: string;
  }): Promise<void> {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Candidate Screening Complete</h2>
        <p>Hi ${input.recruiterName},</p>
        <p>AI screening has been completed for <strong>${input.candidateName}</strong> applying for <strong>${input.jobTitle}</strong>.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <p style="margin: 0;"><strong>Match Score:</strong> ${input.score}/100</p>
          <p style="margin: 10px 0 0 0;"><strong>Decision:</strong> ${input.decision.replace(/_/g, " ")}</p>
        </div>
        <p>Review the detailed screening report and candidate profile in your dashboard.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://app.sensei.ai/recruiter/applications/${input.applicationId}" style="background-color: #4F46E5; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Application
          </a>
        </div>
        <p>The Sensei AI Team</p>
      </div>
    `;

    await this.sendEmail({
      to: input.recruiterEmail,
      subject: `Screening Complete - ${input.candidateName} for ${input.jobTitle}`,
      htmlBody,
    });
  }

  async sendScreeningCompletedCandidate(input: {
    candidateEmail: string;
    candidateName: string;
    jobTitle: string;
    feedback?: string;
  }): Promise<void> {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Application Update</h2>
        <p>Hi ${input.candidateName},</p>
        <p>Thank you for applying for the <strong>${input.jobTitle}</strong> position.</p>
        <p>After careful review of your application, we've decided not to move forward at this time.</p>
        ${
          input.feedback
            ? `
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 4px;">
          <p style="margin: 0;"><strong>Feedback:</strong></p>
          <p style="margin: 10px 0 0 0;">${input.feedback}</p>
        </div>
        `
            : ""
        }
        <p>We encourage you to:</p>
        <ul>
          <li>Continue improving your skills based on the feedback</li>
          <li>Apply to other positions that match your expertise</li>
          <li>Use our practice interview feature to enhance your performance</li>
        </ul>
        <p>Best wishes in your job search!</p>
        <p>The Sensei AI Team</p>
      </div>
    `;

    await this.sendEmail({
      to: input.candidateEmail,
      subject: `Application Update - ${input.jobTitle}`,
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
