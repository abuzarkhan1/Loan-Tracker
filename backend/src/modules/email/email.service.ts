import nodemailer from "nodemailer";
import { Types } from "mongoose";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { isRedisReady, queueRedisConnection } from "../../config/redis";
import { jobNames } from "../../jobs/job.constants";
import { EmailJobPayload } from "../../jobs/job.types";
import { emailQueue } from "../../queues/email.queue";
import { buildEmailTemplate } from "../../utils/emailTemplates";
import { buildPaginationMeta } from "../../utils/pagination";
import { ApiError } from "../../utils/apiError";
import { ContactModel } from "../contacts/contact.model";
import { LoanModel } from "../loans/loan.model";
import { PaymentModel } from "../payments/payment.model";
import { ReceiptModel } from "../receipts/receipt.model";
import { ReportModel } from "../reports/report.model";
import { EmailLogModel, EmailPreferencesModel, EmailStatus, EmailType } from "./email.model";

type SendEmailOptions = {
  toEmail?: string;
  subject?: string;
  message?: string;
  attachPdf?: boolean;
  month?: number;
  year?: number;
};

const toObjectId = (id: string) => new Types.ObjectId(id);
const amount = (value: number) => `Rs ${Number(value || 0).toLocaleString("en-PK")}`;

const getContactName = (value: unknown) =>
  value && typeof value === "object" && "name" in value ? String((value as { name?: string }).name || "Contact") : "Contact";

const getTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_PORT) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
};

export const emailService = {
  async getPreferences(userId: string) {
    return EmailPreferencesModel.findOneAndUpdate(
      { userId: toObjectId(userId) },
      { $setOnInsert: { userId: toObjectId(userId) } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  },

  async updatePreferences(userId: string, payload: Record<string, unknown>) {
    if (payload.defaultRecipientEmail === "") payload.defaultRecipientEmail = undefined;
    return EmailPreferencesModel.findOneAndUpdate(
      { userId: toObjectId(userId) },
      { $set: payload, $setOnInsert: { userId: toObjectId(userId) } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  },

  async getLogs(userId: string, filters: { type?: EmailType; status?: EmailStatus; page: number; limit: number }) {
    const query: Record<string, unknown> = { userId: toObjectId(userId) };
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    const limit = Math.min(filters.limit, 100);
    const [logs, total] = await Promise.all([
      EmailLogModel.find(query).sort({ createdAt: -1 }).skip((filters.page - 1) * limit).limit(limit),
      EmailLogModel.countDocuments(query),
    ]);
    return { logs, pagination: buildPaginationMeta(filters.page, limit, total) };
  },

  async enqueueEmail(userId: string, payload: {
    type: EmailType;
    toEmail?: string;
    subject: string;
    message: string;
    html?: string;
    contactId?: string;
    loanId?: string;
    paymentId?: string;
    receiptId?: string;
    reportId?: string;
    attachments?: Array<{ filename: string; path?: string; href?: string }>;
  }) {
    const preferences = await this.getPreferences(userId);
    const toEmail = payload.toEmail || preferences.defaultRecipientEmail;
    if (!toEmail) throw new ApiError(400, "Recipient email is required");

    const template = buildEmailTemplate(payload.subject, payload.message);
    const emailLog = await EmailLogModel.create({
      userId: toObjectId(userId),
      type: payload.type,
      toEmail,
      subject: payload.subject,
      message: payload.message,
      html: payload.html || template.html,
      status: "QUEUED",
      contactId: payload.contactId ? toObjectId(payload.contactId) : undefined,
      loanId: payload.loanId ? toObjectId(payload.loanId) : undefined,
      paymentId: payload.paymentId ? toObjectId(payload.paymentId) : undefined,
      receiptId: payload.receiptId ? toObjectId(payload.receiptId) : undefined,
      reportId: payload.reportId ? toObjectId(payload.reportId) : undefined,
      attachments: payload.attachments,
    });

    const jobPayload: EmailJobPayload = {
      userId,
      emailLogId: emailLog._id.toString(),
      type: payload.type,
    };

    if (isRedisReady(queueRedisConnection)) {
      await emailQueue.add(jobNames.sendEmail, jobPayload, { jobId: `${jobNames.sendEmail}:${emailLog._id.toString()}` });
    } else {
      await this.processEmail(jobPayload);
    }

    return EmailLogModel.findById(emailLog._id);
  },

  async processEmail(payload: EmailJobPayload) {
    const emailLog = await EmailLogModel.findOne({ _id: payload.emailLogId, userId: payload.userId });
    if (!emailLog) return;

    try {
      const transporter = getTransporter();
      if (!transporter) {
        logger.info("email_provider_not_configured_simulated_send", {
          userId: payload.userId,
          emailLogId: payload.emailLogId,
          toEmail: emailLog.toEmail,
          type: emailLog.type,
        });
        await EmailLogModel.findByIdAndUpdate(emailLog._id, {
          status: "SENT",
          providerMessageId: `simulated-${emailLog._id.toString()}`,
          sentAt: new Date(),
          error: undefined,
        });
        return;
      }

      const result = await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: emailLog.toEmail,
        subject: emailLog.subject,
        text: emailLog.message,
        html: emailLog.html,
        attachments: emailLog.attachments?.map((item) => ({
          filename: item.filename,
          path: item.path,
          href: item.href,
        })),
      });

      await EmailLogModel.findByIdAndUpdate(emailLog._id, {
        status: "SENT",
        providerMessageId: result.messageId,
        sentAt: new Date(),
        error: undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email send failed";
      await EmailLogModel.findByIdAndUpdate(emailLog._id, { status: "FAILED", error: message });
      logger.error("email_send_failed", { userId: payload.userId, emailLogId: payload.emailLogId, error: message });
      throw error;
    }
  },

  async retryEmail(userId: string, emailLogId: string) {
    const emailLog = await EmailLogModel.findOneAndUpdate(
      { _id: emailLogId, userId: toObjectId(userId), status: "FAILED" },
      { $set: { status: "QUEUED" }, $unset: { error: 1 } },
      { new: true },
    );
    if (!emailLog) throw new ApiError(404, "Failed email log not found");

    const jobPayload: EmailJobPayload = {
      userId,
      emailLogId: emailLog._id.toString(),
      type: emailLog.type,
    };

    if (isRedisReady(queueRedisConnection)) {
      await emailQueue.add(jobNames.sendEmail, jobPayload, { jobId: `${jobNames.sendEmail}:retry:${emailLog._id.toString()}:${Date.now()}` });
    } else {
      await this.processEmail(jobPayload);
    }

    return EmailLogModel.findById(emailLog._id);
  },

  async sendPaymentReceipt(userId: string, paymentId: string, options: SendEmailOptions) {
    const payment = await PaymentModel.findOne({ _id: paymentId, userId }).populate("contactId", "name email").populate("loanId", "remainingAmount type");
    if (!payment) throw new ApiError(404, "Payment not found");
    const contact = payment.contactId as unknown as { _id?: Types.ObjectId; name?: string; email?: string };
    const subject = options.subject || `Payment receipt - ${getContactName(contact)}`;
    const message = options.message || `Payment of ${amount(payment.amount)} has been recorded for ${getContactName(contact)}.\nMethod: ${payment.method}\nDate: ${payment.paymentDate.toDateString()}`;
    const receipt = await ReceiptModel.findOne({ userId, paymentId }).sort({ createdAt: -1 });
    return this.enqueueEmail(userId, {
      type: "PAYMENT_RECEIPT_EMAIL",
      toEmail: options.toEmail || contact.email,
      subject,
      message,
      contactId: contact._id?.toString(),
      paymentId,
      loanId: payment.loanId?.toString(),
      receiptId: receipt?._id.toString(),
      attachments: options.attachPdf && receipt?.filePath ? [{ filename: receipt.fileName || "receipt.pdf", path: receipt.filePath }] : undefined,
    });
  },

  async sendLoanSummary(userId: string, loanId: string, options: SendEmailOptions, type: EmailType = "LOAN_SUMMARY_EMAIL") {
    const loan = await LoanModel.findOne({ _id: loanId, userId }).populate("contactId", "name email");
    if (!loan) throw new ApiError(404, "Loan not found");
    const contact = loan.contactId as unknown as { _id?: Types.ObjectId; name?: string; email?: string };
    const subject = options.subject || `${type === "OVERDUE_REMINDER_EMAIL" ? "Overdue reminder" : type === "PAYMENT_REQUEST_EMAIL" ? "Payment request" : "Loan summary"} - ${getContactName(contact)}`;
    const message = options.message || [
      `Loan Summary - ${getContactName(contact)}`,
      `Total Amount: ${amount(loan.amount)}`,
      `Paid/Received: ${amount(loan.paidAmount)}`,
      `Remaining: ${amount(loan.remainingAmount)}`,
      `Status: ${loan.status}`,
      `Due Date: ${loan.dueDate ? loan.dueDate.toDateString() : "-"}`,
    ].join("\n");
    return this.enqueueEmail(userId, {
      type,
      toEmail: options.toEmail || contact.email,
      subject,
      message,
      contactId: contact._id?.toString(),
      loanId,
    });
  },

  async sendContactStatement(userId: string, contactId: string, options: SendEmailOptions) {
    const contact = await ContactModel.findOne({ _id: contactId, userId });
    if (!contact) throw new ApiError(404, "Contact not found");
    const subject = options.subject || `Contact statement - ${contact.name}`;
    const message = options.message || `Attached/recorded statement summary for ${contact.name}. Please review the latest Loan Tracker record.`;
    const report = await ReportModel.findOne({ userId, "metadata.contactId": contactId }).sort({ createdAt: -1 });
    return this.enqueueEmail(userId, {
      type: "CONTACT_STATEMENT_EMAIL",
      toEmail: options.toEmail || contact.email,
      subject,
      message,
      contactId,
      reportId: report?._id.toString(),
      attachments: options.attachPdf && report?.filePath ? [{ filename: report.fileName || "statement.pdf", path: report.filePath }] : undefined,
    });
  },

  async sendMonthlyReport(userId: string, options: SendEmailOptions) {
    const now = new Date();
    const month = options.month || now.getMonth() + 1;
    const year = options.year || now.getFullYear();
    return this.enqueueEmail(userId, {
      type: "MONTHLY_REPORT_EMAIL",
      toEmail: options.toEmail,
      subject: options.subject || `Monthly Loan Tracker report - ${month}/${year}`,
      message: options.message || `Your monthly Loan Tracker report for ${month}/${year} is ready.`,
    });
  },

  sendOverdueReminder(userId: string, loanId: string, options: SendEmailOptions) {
    return this.sendLoanSummary(userId, loanId, options, "OVERDUE_REMINDER_EMAIL");
  },

  sendPaymentRequest(userId: string, loanId: string, options: SendEmailOptions) {
    return this.sendLoanSummary(userId, loanId, options, "PAYMENT_REQUEST_EMAIL");
  },

  sendSettlementConfirmation(userId: string, loanId: string, options: SendEmailOptions) {
    return this.sendLoanSummary(userId, loanId, options, "SETTLEMENT_CONFIRMATION_EMAIL");
  },
};
