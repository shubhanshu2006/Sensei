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
