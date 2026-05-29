import { Job, Worker } from "bullmq";
import { queueRedisOptions } from "../config/redis";
import { logger } from "../config/logger";
import { queueNames } from "../jobs/job.constants";
import { ReportJobPayload } from "../jobs/job.types";
import { reportService } from "../modules/reports/report.service";

export const createReportWorker = () =>
  new Worker<ReportJobPayload>(
    queueNames.report,
    async (job: Job<ReportJobPayload>) => {
      logger.info("report_job_started", {
        queueName: queueNames.report,
        jobId: job.id,
        jobName: job.name,
        userId: job.data.userId,
        reportId: job.data.reportId,
        type: job.data.type,
      });
      await reportService.processReport(job.data);
      return { ok: true };
    },
    { connection: queueRedisOptions, concurrency: 2 },
  );
