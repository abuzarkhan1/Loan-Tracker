import { Job, Worker } from "bullmq";
import { logger } from "../config/logger";
import { queueRedisOptions } from "../config/redis";
import { AlertJobPayload } from "../jobs/job.types";
import { queueNames } from "../jobs/job.constants";
import { UserModel } from "../modules/auth/user.model";
import { alertService } from "../modules/alerts/alert.service";

export const createAlertWorker = () =>
  new Worker<AlertJobPayload>(
    queueNames.alert,
    async (job: Job<AlertJobPayload>) => {
      logger.info("alert_job_started", { queueName: queueNames.alert, jobId: job.id, jobName: job.name, userId: job.data.userId });
      if (job.data.userId) {
        await alertService.evaluate(job.data.userId);
        return { processed: 1 };
      }
      const users = await UserModel.find().select("_id");
      await Promise.allSettled(users.map((user) => alertService.evaluate(user._id.toString())));
      return { processed: users.length };
    },
    { connection: queueRedisOptions, concurrency: 2 },
  );
