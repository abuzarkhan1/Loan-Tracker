import { Job, Worker } from "bullmq";
import { queueRedisOptions } from "../config/redis";
import { logger } from "../config/logger";
import { queueNames } from "../jobs/job.constants";
import { AuditJobPayload } from "../jobs/job.types";
import { auditLogService } from "../modules/audit/audit-log.service";

export const createAuditWorker = () =>
  new Worker<AuditJobPayload>(
    queueNames.audit,
    async (job: Job<AuditJobPayload>) => {
      logger.info("audit_job_started", {
        queueName: queueNames.audit,
        jobId: job.id,
        jobName: job.name,
        userId: job.data.userId,
        action: job.data.action,
      });
      await auditLogService.writeDirect(job.data);
      return { ok: true };
    },
    { connection: queueRedisOptions, concurrency: 10 },
  );
