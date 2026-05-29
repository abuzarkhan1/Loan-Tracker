import { Job, Worker } from "bullmq";
import { queueRedisOptions } from "../config/redis";
import { logger } from "../config/logger";
import { queueNames } from "../jobs/job.constants";
import { SalaryJobPayload } from "../jobs/job.types";
import { SalaryProfileModel } from "../modules/salary/salary-profile.model";
import { salaryService } from "../modules/salary/salary.service";

export const createSalaryWorker = () =>
  new Worker<SalaryJobPayload>(
    queueNames.salary,
    async (job: Job<SalaryJobPayload>) => {
      logger.info("salary_job_started", {
        queueName: queueNames.salary,
        jobId: job.id,
        jobName: job.name,
        userId: job.data.userId,
      });

      if (job.data.userId) {
        await salaryService.ensureExpectedForCurrentCycle(job.data.userId);
        await salaryService.queueSalaryReminderIfDue(job.data.userId);
        return { processed: 1 };
      }

      const profiles = await SalaryProfileModel.find({ autoCreateExpectedSalary: true }).select("userId");
      await Promise.all(profiles.map(async (profile) => {
        const userId = profile.userId.toString();
        await salaryService.ensureExpectedForCurrentCycle(userId);
        await salaryService.queueSalaryReminderIfDue(userId);
      }));
      return { processed: profiles.length };
    },
    { connection: queueRedisOptions, concurrency: 2 },
  );
