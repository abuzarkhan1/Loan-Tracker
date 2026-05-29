import { Job, Worker } from "bullmq";
import { queueRedisOptions } from "../config/redis";
import { logger } from "../config/logger";
import { queueNames } from "../jobs/job.constants";
import { EmailJobPayload } from "../jobs/job.types";
import { emailService } from "../modules/email/email.service";

export const createEmailWorker = () =>
  new Worker<EmailJobPayload>(
    queueNames.email,
    async (job: Job<EmailJobPayload>) => {
      logger.info("email_job_started", {
        queueName: queueNames.email,
        jobId: job.id,
        jobName: job.name,
        userId: job.data.userId,
        emailLogId: job.data.emailLogId,
        type: job.data.type,
      });
      await emailService.processEmail(job.data);
      return { ok: true };
    },
    { connection: queueRedisOptions, concurrency: 3 },
  );
