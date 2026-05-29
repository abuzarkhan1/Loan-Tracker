import { Job, Worker } from "bullmq";
import { queueRedisOptions } from "../config/redis";
import { logger } from "../config/logger";
import { queueNames } from "../jobs/job.constants";
import { ReceiptJobPayload, ReportJobPayload } from "../jobs/job.types";
import { jobNames } from "../jobs/job.constants";
import { receiptService } from "../modules/receipts/receipt.service";
import { reportService } from "../modules/reports/report.service";

export const createReportWorker = () =>
  new Worker<ReportJobPayload | ReceiptJobPayload>(
    queueNames.report,
    async (job: Job<ReportJobPayload | ReceiptJobPayload>) => {
      logger.info("report_job_started", {
        queueName: queueNames.report,
        jobId: job.id,
        jobName: job.name,
        userId: job.data.userId,
        reportId: "reportId" in job.data ? job.data.reportId : undefined,
        receiptId: "receiptId" in job.data ? job.data.receiptId : undefined,
        type: job.data.type,
      });
      if (job.name === jobNames.receiptPdf && "receiptId" in job.data) {
        await receiptService.processReceipt(job.data);
      } else {
        await reportService.processReport(job.data as ReportJobPayload);
      }
      return { ok: true };
    },
    { connection: queueRedisOptions, concurrency: 2 },
  );
