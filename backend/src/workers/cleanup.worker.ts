import { Job, Worker } from "bullmq";
import { queueRedisOptions } from "../config/redis";
import { logger } from "../config/logger";
import { queueNames } from "../jobs/job.constants";
import { CleanupJobPayload } from "../jobs/job.types";

export const createCleanupWorker = () =>
  new Worker<CleanupJobPayload>(
    queueNames.cleanup,
    async (job: Job<CleanupJobPayload>) => {
      logger.info("cleanup_job_started", {
        queueName: queueNames.cleanup,
        jobId: job.id,
        jobName: job.name,
        scope: job.data.scope,
      });
      return { ok: true };
    },
    { connection: queueRedisOptions, concurrency: 1 },
  );
