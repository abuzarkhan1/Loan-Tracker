import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { Types } from "mongoose";
import { logger } from "../../config/logger";
import { isRedisReady, queueRedisConnection } from "../../config/redis";
import { jobNames } from "../../jobs/job.constants";
import { ReceiptJobPayload } from "../../jobs/job.types";
import { reportQueue } from "../../queues/report.queue";
import { localStorageService } from "../../storage/local-storage.service";
import { ApiError } from "../../utils/apiError";
import { createReceiptNumber } from "../../utils/receiptNumber";
import { buildPaginationMeta } from "../../utils/pagination";
import { ContactModel } from "../contacts/contact.model";
import { LoanModel } from "../loans/loan.model";
import { PaymentModel } from "../payments/payment.model";
import { ReceiptModel, ReceiptStatus, ReceiptType } from "./receipt.model";

type ReceiptFilters = {
  type?: ReceiptType;
  status?: ReceiptStatus;
  page: number;
  limit: number;
};

const toObjectId = (id: string) => new Types.ObjectId(id);
const amount = (value: number) => `Rs ${Number(value || 0).toLocaleString("en-PK")}`;
const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-");

const writeReceiptPdf = async (
  filePath: string,
  data: {
    receiptNumber: string;
    title: string;
    rows: Array<[string, string]>;
    amountLabel: string;
    amountValue: number;
  },
) =>
  new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 44, size: "A4" });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const primary = "#f36f56";
    const darkText = "#25212b";
    const mutedText = "#6f6577";
    const cardBg = "#fff7ef";
    const border = "#ffe4d3";

    doc.roundedRect(44, 44, 507, 720, 18).stroke(border);
    doc.fillColor(primary).font("Helvetica-Bold").fontSize(10).text("LOAN TRACKER", 72, 76, { characterSpacing: 1.6 });
    doc.fillColor(darkText).font("Helvetica-Bold").fontSize(28).text(data.title, 72, 96, { width: 360 });
    doc.fillColor(mutedText).font("Helvetica").fontSize(10).text(`Receipt # ${data.receiptNumber}`, 72, 134);
    doc.text(`Generated ${new Date().toLocaleString()}`, 72, 150);

    doc.roundedRect(72, 190, 451, 92, 14).fillAndStroke(cardBg, border);
    doc.fillColor(mutedText).font("Helvetica-Bold").fontSize(10).text(data.amountLabel.toUpperCase(), 98, 214);
    doc.fillColor(primary).font("Helvetica-Bold").fontSize(30).text(amount(data.amountValue), 98, 232);

    let y = 326;
    data.rows.forEach(([label, value]) => {
      doc.fillColor(mutedText).font("Helvetica-Bold").fontSize(9).text(label.toUpperCase(), 72, y);
      doc.fillColor(darkText).font("Helvetica").fontSize(12).text(value || "-", 230, y - 1, { width: 280, align: "right" });
      y += 34;
      doc.strokeColor("rgba(80, 61, 52, 0.12)").moveTo(72, y - 13).lineTo(523, y - 13).stroke();
    });

    doc.fillColor(mutedText).font("Helvetica").fontSize(9).text(
      "This receipt is generated from user-entered Loan Tracker records.",
      72,
      724,
      { width: 451, align: "center" },
    );

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

export const receiptService = {
  async createReceipt(userId: string, type: ReceiptType, metadata: Record<string, unknown>) {
    const title = type === ReceiptType.PAYMENT_RECEIPT
      ? "Payment Receipt"
      : type === ReceiptType.LOAN_SUMMARY_RECEIPT
        ? "Loan Summary Receipt"
        : "Contact Statement Receipt";

    const receipt = await ReceiptModel.create({
      userId: toObjectId(userId),
      receiptNumber: createReceiptNumber(),
      type,
      title,
      status: ReceiptStatus.PENDING,
      loanId: metadata.loanId ? toObjectId(String(metadata.loanId)) : undefined,
      paymentId: metadata.paymentId ? toObjectId(String(metadata.paymentId)) : undefined,
      contactId: metadata.contactId ? toObjectId(String(metadata.contactId)) : undefined,
      metadata,
    });

    const payload: ReceiptJobPayload = {
      userId,
      receiptId: receipt._id.toString(),
      type,
      metadata,
    };

    if (isRedisReady(queueRedisConnection)) {
      await reportQueue.add(jobNames.receiptPdf, payload, {
        jobId: `${jobNames.receiptPdf}:${receipt._id.toString()}`,
      });
    } else {
      await this.processReceipt(payload);
    }

    return ReceiptModel.findById(receipt._id);
  },

  createPaymentReceipt(userId: string, paymentId: string) {
    return this.createReceipt(userId, ReceiptType.PAYMENT_RECEIPT, { paymentId });
  },

  createLoanReceipt(userId: string, loanId: string) {
    return this.createReceipt(userId, ReceiptType.LOAN_SUMMARY_RECEIPT, { loanId });
  },

  createContactReceipt(userId: string, contactId: string) {
    return this.createReceipt(userId, ReceiptType.CONTACT_STATEMENT_RECEIPT, { contactId });
  },

  async getReceipts(userId: string, filters: ReceiptFilters) {
    const query: Record<string, unknown> = { userId: toObjectId(userId) };
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    const limit = Math.min(filters.limit, 100);
    const skip = (filters.page - 1) * limit;
    const [receipts, total] = await Promise.all([
      ReceiptModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ReceiptModel.countDocuments(query),
    ]);
    return {
      receipts,
      pagination: buildPaginationMeta(filters.page, limit, total),
    };
  },

  async getReceipt(userId: string, receiptId: string) {
    const receipt = await ReceiptModel.findOne({ _id: receiptId, userId });
    if (!receipt) throw new ApiError(404, "Receipt not found");
    return receipt;
  },

  async deleteReceipt(userId: string, receiptId: string) {
    const receipt = await this.getReceipt(userId, receiptId);
    await Promise.all([
      localStorageService.remove(receipt.filePath),
      receipt.deleteOne(),
    ]);
    return { id: receiptId };
  },

  async processReceipt(payload: ReceiptJobPayload) {
    const receipt = await ReceiptModel.findOne({ _id: payload.receiptId, userId: payload.userId });
    if (!receipt) return;

    logger.info("receipt_job_started", {
      queueName: "reportQueue",
      jobId: payload.receiptId,
      receiptId: payload.receiptId,
      userId: payload.userId,
      type: payload.type,
    });

    try {
      await ReceiptModel.findByIdAndUpdate(payload.receiptId, { status: ReceiptStatus.PROCESSING, error: undefined });
      const rows = await this.buildReceiptRows(payload.userId, receipt);

      await localStorageService.ensureDirectories();
      const fileName = `${receipt.type.toLowerCase()}-${payload.userId}-${timestamp()}.pdf`;
      const filePath = path.join(localStorageService.receiptsDir, fileName);
      const relativePath = path.relative(process.cwd(), filePath).split(path.sep).join("/");
      await writeReceiptPdf(filePath, {
        receiptNumber: receipt.receiptNumber,
        title: receipt.title,
        rows: rows.rows,
        amountLabel: rows.amountLabel,
        amountValue: rows.amountValue,
      });

      await ReceiptModel.findByIdAndUpdate(payload.receiptId, {
        status: ReceiptStatus.GENERATED,
        pdfUrl: localStorageService.buildPublicUrl(relativePath),
        filePath,
        fileName,
      });
      logger.info("receipt_job_completed", { queueName: "reportQueue", jobId: payload.receiptId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Receipt generation failed";
      await ReceiptModel.findByIdAndUpdate(payload.receiptId, { status: ReceiptStatus.FAILED, error: message });
      logger.error("receipt_job_failed", { queueName: "reportQueue", jobId: payload.receiptId, error: message });
      throw error;
    }
  },

  async buildReceiptRows(userId: string, receipt: { type: ReceiptType; paymentId?: Types.ObjectId; loanId?: Types.ObjectId; contactId?: Types.ObjectId }) {
    if (receipt.type === ReceiptType.PAYMENT_RECEIPT) {
      const payment = await PaymentModel.findOne({ _id: receipt.paymentId, userId }).populate("contactId", "name phone").populate("loanId", "type remainingAmount");
      if (!payment) throw new ApiError(404, "Payment not found");
      const contact = payment.contactId as unknown as { name?: string; phone?: string };
      const loan = payment.loanId as unknown as { type?: string; remainingAmount?: number };
      return {
        amountLabel: "Payment amount",
        amountValue: payment.amount,
        rows: [
          ["Contact", contact?.name || "Contact"],
          ["Phone", contact?.phone || "-"],
          ["Loan Type", loan?.type || "-"],
          ["Method", payment.method],
          ["Payment Date", payment.paymentDate.toDateString()],
          ["Remaining After Payment", amount(loan?.remainingAmount || 0)],
          ["Notes", payment.note || "-"],
        ] as Array<[string, string]>,
      };
    }

    if (receipt.type === ReceiptType.LOAN_SUMMARY_RECEIPT) {
      const loan = await LoanModel.findOne({ _id: receipt.loanId, userId }).populate("contactId", "name phone");
      if (!loan) throw new ApiError(404, "Loan not found");
      const contact = loan.contactId as unknown as { name?: string; phone?: string };
      return {
        amountLabel: "Remaining amount",
        amountValue: loan.remainingAmount,
        rows: [
          ["Contact", contact?.name || "Contact"],
          ["Phone", contact?.phone || "-"],
          ["Loan Type", loan.type],
          ["Total Amount", amount(loan.amount)],
          ["Paid/Received", amount(loan.paidAmount)],
          ["Status", loan.status],
          ["Due Date", loan.dueDate ? loan.dueDate.toDateString() : "-"],
        ] as Array<[string, string]>,
      };
    }

    const contact = await ContactModel.findOne({ _id: receipt.contactId, userId });
    if (!contact) throw new ApiError(404, "Contact not found");
    const loans = await LoanModel.find({ userId, contactId: contact._id });
    const payments = await PaymentModel.find({ userId, contactId: contact._id });
    const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const paidAmount = loans.reduce((sum, loan) => sum + loan.paidAmount, 0);
    const remainingAmount = loans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    return {
      amountLabel: "Remaining balance",
      amountValue: remainingAmount,
      rows: [
        ["Contact", contact.name],
        ["Phone", contact.phone || "-"],
        ["Total Loans", String(loans.length)],
        ["Total Amount", amount(totalAmount)],
        ["Paid/Received", amount(paidAmount)],
        ["Payments", String(payments.length)],
        ["Remaining", amount(remainingAmount)],
      ] as Array<[string, string]>,
    };
  },
};
