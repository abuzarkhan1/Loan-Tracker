import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { Types } from "mongoose";
import { logger } from "../../config/logger";
import { isRedisReady, queueRedisConnection } from "../../config/redis";
import { jobNames } from "../../jobs/job.constants";
import { ReportJobPayload } from "../../jobs/job.types";
import { reportQueue } from "../../queues/report.queue";
import { localStorageService } from "../../storage/local-storage.service";
import { ApiError } from "../../utils/apiError";
import { buildPaginationMeta } from "../../utils/pagination";
import { ContactModel } from "../contacts/contact.model";
import { LoanModel } from "../loans/loan.model";
import { PaymentModel } from "../payments/payment.model";
import { ReportModel, ReportStatus, ReportType } from "./report.model";

type ReportFilters = {
  type?: ReportType;
  status?: ReportStatus;
  page: number;
  limit: number;
};

type DateRange = {
  dateFrom?: Date;
  dateTo?: Date;
};

const toObjectId = (id: string) => new Types.ObjectId(id);

const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-");

const amount = (value: number) => `Rs ${Number(value || 0).toLocaleString("en-PK")}`;

const buildDateFilter = (field: string, range?: DateRange) => {
  if (!range?.dateFrom && !range?.dateTo) return {};
  return {
    [field]: {
      ...(range.dateFrom ? { $gte: new Date(range.dateFrom) } : {}),
      ...(range.dateTo ? { $lte: new Date(range.dateTo) } : {}),
    },
  };
};

const writeCustomPdf = async (
  filePath: string,
  title: string,
  data: {
    contact?: { name: string; phone?: string };
    summary: { totalLoans: number; totalPayments: number; remaining: number; totalAmount: number; totalPaid: number };
    loans: Array<{ date: string; type: string; amount: number; paid: number; remaining: number; status: string }>;
    payments: Array<{ date: string; type: string; amount: number; method: string; note?: string }>;
    metadata?: { month?: number; year?: number; range?: string };
  }
) => {
  return new Promise<void>((resolve, reject) => {
    // Buffer document pages so we can compute total page count at the end
    const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Accent Colors matching the application light theme design system
    const primary = "#f36f56";
    const darkText = "#25212b";
    const mutedText = "#6f6577";
    const success = "#1b7d62";
    const cardBg = "#fff7ef";
    const peachBorder = "#ffe4d3";
    const tableHeaderBg = "#2b2631";
    const alternatingBg = "#fffaf4";
    const borderLight = "rgba(80, 61, 52, 0.08)";

    // --- Header Section ---
    doc.rect(40, 40, 6, 42).fill(primary); // colored vertical accent bar
    doc.fillColor(primary);
    doc.fontSize(9).font("Helvetica-Bold").text("LOAN TRACKER", 54, 40, { characterSpacing: 1.5 });
    doc.fontSize(20).font("Helvetica-Bold").fillColor(darkText).text(title, 54, 52);
    
    // Metadata Block on Top-Right
    doc.fontSize(8).font("Helvetica").fillColor(mutedText).text(`Report ID: ${path.basename(filePath, ".pdf").slice(0, 24)}...`, 380, 40, { align: "right", width: 175 });
    doc.text(`Generated: ${new Date().toLocaleString()}`, 380, 52, { align: "right", width: 175 });
    if (data.metadata?.range) {
      doc.text(`Date Range: ${data.metadata.range}`, 380, 64, { align: "right", width: 175 });
    } else if (data.metadata?.month && data.metadata?.year) {
      doc.text(`Period: ${data.metadata.month}/${data.metadata.year}`, 380, 64, { align: "right", width: 175 });
    }

    let y = 105;

    // --- Contact Detail Section ---
    if (data.contact) {
      doc.fontSize(10).font("Helvetica-Bold").fillColor(darkText).text("Client Profile details", 40, y);
      doc.font("Helvetica").fontSize(9).fillColor(mutedText).text(`Name: ${data.contact.name}`, 40, y + 14);
      doc.text(`Phone: ${data.contact.phone || "-"}`, 240, y + 14);
      y += 34;
    }

    // --- Summary Metrics Card ---
    doc.roundedRect(40, y, 515, 54, 8).fillAndStroke(cardBg, peachBorder);
    
    // Total Loaned Metric
    doc.fillColor(mutedText).fontSize(7.5).font("Helvetica").text("TOTAL LOANED", 60, y + 13);
    doc.fillColor(darkText).fontSize(12).font("Helvetica-Bold").text(amount(data.summary.totalAmount), 60, y + 23);

    // Total Paid Metric
    doc.fillColor(mutedText).fontSize(7.5).font("Helvetica").text("TOTAL PAID", 195, y + 13);
    doc.fillColor(success).fontSize(12).font("Helvetica-Bold").text(amount(data.summary.totalPaid), 195, y + 23);

    // Outstanding Balance Metric
    doc.fillColor(mutedText).fontSize(7.5).font("Helvetica").text("OUTSTANDING BALANCE", 330, y + 13);
    doc.fillColor(primary).fontSize(12).font("Helvetica-Bold").text(amount(data.summary.remaining), 330, y + 23);

    // Counts summary
    doc.fillColor(mutedText).fontSize(7.5).font("Helvetica").text(`Loans: ${data.summary.totalLoans}\nPayments: ${data.summary.totalPayments}`, 450, y + 15, { align: "right", width: 90 });

    y += 74;

    // Helper to start a new page if space is insufficient
    const checkPageWrap = (neededHeight: number) => {
      if (y + neededHeight > doc.page.height - doc.page.margins.bottom - 30) {
        doc.addPage();
        y = doc.page.margins.top;
        return true;
      }
      return false;
    };

    // --- Table Drawer ---
    const drawTable = (
      tableTitle: string,
      headers: string[],
      colWidths: number[],
      rows: Array<string[]>
    ) => {
      checkPageWrap(40);
      doc.fontSize(11).font("Helvetica-Bold").fillColor(darkText).text(tableTitle, 40, y);
      y += 16;

      // Draw Table Header
      checkPageWrap(24);
      doc.rect(40, y, 515, 20).fill(tableHeaderBg);
      let colX = 40;
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff");
      headers.forEach((h, idx) => {
        doc.text(h, colX + 8, y + 6, { width: colWidths[idx] - 16, align: "left" });
        colX += colWidths[idx];
      });
      y += 20;

      // Draw Data Rows
      rows.forEach((row, rowIdx) => {
        checkPageWrap(18);
        
        // Alternating background color
        if (rowIdx % 2 === 1) {
          doc.rect(40, y, 515, 16).fill(alternatingBg);
        }
        
        let cellX = 40;
        row.forEach((cell, cellIdx) => {
          let color = darkText;
          let font = "Helvetica";
          
          if (cell === "PAID" || cell === "COMPLETED") {
            color = success;
            font = "Helvetica-Bold";
          } else if (cell === "ACTIVE" || cell === "OVERDUE") {
            color = primary;
            font = "Helvetica-Bold";
          } else if (cellIdx === 0) {
            color = mutedText; // dates in muted
          }

          doc.fillColor(color).font(font).fontSize(8);
          doc.text(cell, cellX + 8, y + 4, { width: colWidths[cellIdx] - 16, lineBreak: false });
          cellX += colWidths[cellIdx];
        });

        // Separator Line
        doc.strokeColor(borderLight).lineWidth(0.5).moveTo(40, y + 16).lineTo(555, y + 16).stroke();
        y += 16;
      });

      y += 16; // space below table
    };

    // --- Draw Tables ---
    if (data.loans.length > 0) {
      const loanHeaders = ["Date", "Type", "Amount", "Paid", "Remaining", "Status"];
      const loanWidths = [90, 85, 90, 90, 90, 70];
      const loanRows = data.loans.map((l) => [
        l.date,
        l.type,
        amount(l.amount),
        amount(l.paid),
        amount(l.remaining),
        l.status,
      ]);
      drawTable("Loans details", loanHeaders, loanWidths, loanRows);
    }

    if (data.payments.length > 0) {
      const paymentHeaders = ["Date", "Type", "Amount", "Method", "Note"];
      const paymentWidths = [100, 90, 100, 90, 135];
      const paymentRows = data.payments.map((p) => [
        p.date,
        p.type,
        amount(p.amount),
        p.method,
        p.note || "-",
      ]);
      drawTable("Payments history", paymentHeaders, paymentWidths, paymentRows);
    }

    // --- Footer & Page Numbers ( buffered loop ) ---
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(7.5).fillColor(mutedText).text(
        `Page ${i + 1} of ${pages.count}`,
        40,
        doc.page.height - 25,
        { align: "center", width: 515 }
      );
    }

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
};

export const reportService = {
  async createReport(userId: string, type: ReportType, metadata: Record<string, unknown> = {}) {
    const report = await ReportModel.create({
      userId: toObjectId(userId),
      type,
      status: ReportStatus.PENDING,
      metadata,
    });

    const payload: ReportJobPayload = {
      userId,
      reportId: report._id.toString(),
      type,
      metadata,
    };

    if (isRedisReady(queueRedisConnection)) {
      await reportQueue.add(type.startsWith("EXCEL") ? jobNames.excelExport : jobNames.pdfReport, payload);
    } else {
      await this.processReport(payload);
    }

    return ReportModel.findById(report._id);
  },

  createContactPdf(userId: string, contactId: string, range?: DateRange) {
    return this.createReport(userId, ReportType.CONTACT_STATEMENT, { contactId, ...range });
  },

  createMonthlyPdf(userId: string, month: number, year: number) {
    return this.createReport(userId, ReportType.MONTHLY_REPORT, { month, year });
  },

  createCompleteHistoryPdf(userId: string) {
    return this.createReport(userId, ReportType.COMPLETE_HISTORY);
  },

  createLoansExcel(userId: string, filter?: Record<string, unknown>) {
    return this.createReport(userId, ReportType.EXCEL_LOANS, filter);
  },

  createPaymentsExcel(userId: string, filter?: Record<string, unknown>) {
    return this.createReport(userId, ReportType.EXCEL_PAYMENTS, filter);
  },

  createContactExcel(userId: string, contactId: string, filter?: Record<string, unknown>) {
    return this.createReport(userId, ReportType.EXCEL_CONTACT, { contactId, ...filter });
  },

  async getReports(userId: string, filters: ReportFilters) {
    const query: Record<string, unknown> = { userId: toObjectId(userId) };
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;

    const total = await ReportModel.countDocuments(query);
    const meta = buildPaginationMeta(filters.page, filters.limit, total);

    const reports = await ReportModel.find(query)
      .sort({ createdAt: -1 })
      .skip((filters.page - 1) * filters.limit)
      .limit(filters.limit);

    return { reports, meta };
  },

  getReport(userId: string, reportId: string) {
    return ReportModel.findOne({ _id: toObjectId(reportId), userId: toObjectId(userId) });
  },

  deleteReport(userId: string, reportId: string) {
    return ReportModel.findOneAndDelete({ _id: toObjectId(reportId), userId: toObjectId(userId) });
  },

  async processReport(payload: ReportJobPayload) {
    const report = await ReportModel.findById(payload.reportId);
    if (!report) return;

    logger.info("report_job_started", {
      queueName: "reportQueue",
      jobId: payload.reportId,
      jobName: payload.type.startsWith("EXCEL") ? "excel-export" : "pdf-report",
      userId: payload.userId,
      reportId: payload.reportId,
      type: payload.type,
    });

    try {
      await ReportModel.findByIdAndUpdate(payload.reportId, { status: ReportStatus.PROCESSING });

      const result = payload.type.startsWith("EXCEL")
        ? await this.generateExcel(payload)
        : await this.generatePdf(payload);

      await ReportModel.findByIdAndUpdate(payload.reportId, {
        status: ReportStatus.COMPLETED,
        fileUrl: result.fileUrl,
        filePath: result.filePath,
        fileName: result.fileName,
      });

      logger.info("queue_job_completed", {
        queueName: "reportQueue",
        jobId: payload.reportId,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Report generation failed";
      logger.error("queue_job_failed", {
        queueName: "reportQueue",
        jobId: payload.reportId,
        error: message,
      });
      await ReportModel.findByIdAndUpdate(payload.reportId, {
        status: ReportStatus.FAILED,
        error: message,
      });
      throw error;
    }
  },

  async generatePdf(payload: ReportJobPayload) {
    await localStorageService.ensureDirectories();
    const fileName = `${payload.type.toLowerCase()}-${payload.userId}-${timestamp()}.pdf`;
    const filePath = path.join(localStorageService.reportsDir, fileName);
    const relativePath = path.relative(process.cwd(), filePath).split(path.sep).join("/");

    // --- Gather Database Information ---
    let contactInfo: { name: string; phone?: string } | undefined;
    let loansData: Array<{ date: string; type: string; amount: number; paid: number; remaining: number; status: string }> = [];
    let paymentsData: Array<{ date: string; type: string; amount: number; method: string; note?: string }> = [];
    let metadata: { month?: number; year?: number; range?: string } = {};

    if (payload.type === ReportType.CONTACT_STATEMENT) {
      const contactId = String(payload.metadata?.contactId || "");
      const contact = await ContactModel.findOne({ _id: contactId, userId: payload.userId });
      if (!contact) throw new Error("Contact not found");
      contactInfo = { name: contact.name, phone: contact.phone || undefined };

      const loans = await LoanModel.find({
        userId: payload.userId,
        contactId,
        ...buildDateFilter("issueDate", payload.metadata as DateRange),
      }).sort({ issueDate: -1 });

      const payments = await PaymentModel.find({
        userId: payload.userId,
        contactId,
        ...buildDateFilter("paymentDate", payload.metadata as DateRange),
      }).sort({ paymentDate: -1 });

      loansData = loans.map((l) => ({
        date: l.issueDate.toDateString(),
        type: l.type,
        amount: l.amount,
        paid: l.paidAmount,
        remaining: l.remainingAmount,
        status: l.status,
      }));

      paymentsData = payments.map((p) => ({
        date: p.paymentDate.toDateString(),
        type: p.type,
        amount: p.amount,
        method: p.method,
        note: p.note || undefined,
      }));

      if (payload.metadata?.dateFrom || payload.metadata?.dateTo) {
        const metadataAny = payload.metadata as any;
        metadata.range = `${metadataAny.dateFrom ? new Date(metadataAny.dateFrom).toLocaleDateString() : "*"} - ${metadataAny.dateTo ? new Date(metadataAny.dateTo).toLocaleDateString() : "*"}`;
      }
    } else if (payload.type === ReportType.MONTHLY_REPORT) {
      const month = Number(payload.metadata?.month);
      const year = Number(payload.metadata?.year);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      metadata = { month, year };

      const loans = await LoanModel.find({ userId: payload.userId, issueDate: { $gte: start, $lte: end } }).sort({ issueDate: -1 });
      const payments = await PaymentModel.find({ userId: payload.userId, paymentDate: { $gte: start, $lte: end } }).sort({ paymentDate: -1 });

      loansData = loans.map((l) => ({
        date: l.issueDate.toDateString(),
        type: l.type,
        amount: l.amount,
        paid: l.paidAmount,
        remaining: l.remainingAmount,
        status: l.status,
      }));

      paymentsData = payments.map((p) => ({
        date: p.paymentDate.toDateString(),
        type: p.type,
        amount: p.amount,
        method: p.method,
        note: p.note || undefined,
      }));
    } else {
      // COMPLETE_HISTORY
      const loans = await LoanModel.find({ userId: payload.userId }).sort({ issueDate: -1 });
      const payments = await PaymentModel.find({ userId: payload.userId }).sort({ paymentDate: -1 });

      loansData = loans.map((l) => ({
        date: l.issueDate.toDateString(),
        type: l.type,
        amount: l.amount,
        paid: l.paidAmount,
        remaining: l.remainingAmount,
        status: l.status,
      }));

      paymentsData = payments.map((p) => ({
        date: p.paymentDate.toDateString(),
        type: p.type,
        amount: p.amount,
        method: p.method,
        note: p.note || undefined,
      }));
    }

    // --- Calculate Summary Totals ---
    const totalAmount = loansData.reduce((sum, l) => sum + l.amount, 0);
    const totalPaid = loansData.reduce((sum, l) => sum + l.paid, 0);
    const remaining = loansData.reduce((sum, l) => sum + l.remaining, 0);
    const totalLoans = loansData.length;
    const totalPayments = paymentsData.length;

    const summary = {
      totalLoans,
      totalPayments,
      totalAmount,
      totalPaid,
      remaining,
    };

    // --- Generate Document using our Premium PDF Layout Builder ---
    await writeCustomPdf(filePath, this.getReportTitle(payload.type), {
      contact: contactInfo,
      summary,
      loans: loansData,
      payments: paymentsData,
      metadata,
    });

    return {
      fileName,
      filePath,
      fileUrl: localStorageService.buildPublicUrl(relativePath),
    };
  },

  async generateExcel(payload: ReportJobPayload) {
    await localStorageService.ensureDirectories();
    const fileName = `${payload.type.toLowerCase()}-${payload.userId}-${timestamp()}.xlsx`;
    const filePath = path.join(localStorageService.reportsDir, fileName);
    const relativePath = path.relative(process.cwd(), filePath).split(path.sep).join("/");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Loan Tracker";
    workbook.created = new Date();

    if (payload.type === ReportType.EXCEL_PAYMENTS) {
      const sheet = workbook.addWorksheet("Payments");
      sheet.columns = [
        { header: "Date", key: "date", width: 16 },
        { header: "Type", key: "type", width: 14 },
        { header: "Amount", key: "amount", width: 14 },
        { header: "Method", key: "method", width: 16 },
        { header: "Note", key: "note", width: 32 },
      ];
      const payments = await PaymentModel.find({ userId: payload.userId }).sort({ paymentDate: -1 });
      payments.forEach((payment) => {
        sheet.addRow({
          date: payment.paymentDate.toISOString().slice(0, 10),
          type: payment.type,
          amount: payment.amount,
          method: payment.method,
          note: payment.note || "",
        });
      });
    } else {
      const sheet = workbook.addWorksheet(payload.type === ReportType.EXCEL_CONTACT ? "Contact Report" : "Loans");
      sheet.columns = [
        { header: "Issue Date", key: "issueDate", width: 16 },
        { header: "Type", key: "type", width: 14 },
        { header: "Amount", key: "amount", width: 14 },
        { header: "Paid", key: "paidAmount", width: 14 },
        { header: "Remaining", key: "remainingAmount", width: 14 },
        { header: "Status", key: "status", width: 18 },
        { header: "Description", key: "description", width: 36 },
      ];
      const filter: Record<string, unknown> = { userId: payload.userId };
      if (payload.type === ReportType.EXCEL_CONTACT && payload.metadata?.contactId) {
        filter.contactId = payload.metadata.contactId;
      }
      const loans = await LoanModel.find(filter).sort({ issueDate: -1 });
      loans.forEach((loan) => {
        sheet.addRow({
          issueDate: loan.issueDate.toISOString().slice(0, 10),
          type: loan.type,
          amount: loan.amount,
          paidAmount: loan.paidAmount,
          remainingAmount: loan.remainingAmount,
          status: loan.status,
          description: loan.description || "",
        });
      });
    }

    workbook.eachSheet((sheet) => {
      sheet.getRow(1).font = { bold: true };
    });
    await workbook.xlsx.writeFile(filePath);

    return {
      fileName,
      filePath,
      fileUrl: localStorageService.buildPublicUrl(relativePath),
    };
  },

  getReportTitle(type: ReportType) {
    if (type === ReportType.CONTACT_STATEMENT) return "Contact Loan Statement";
    if (type === ReportType.MONTHLY_REPORT) return "Monthly Loan Report";
    return "Complete Loan History";
  },
};
