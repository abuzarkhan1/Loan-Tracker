import { createQueue, createQueueEvents } from "../config/queue";
import { logger } from "../config/logger";
import { jobNames, queueNames } from "../jobs/job.constants";

export const salaryQueue = createQueue(queueNames.salary);
export const salaryQueueEvents = createQueueEvents(queueNames.salary);

export const scheduleSalaryQueueJobs = async () => {
  try {
    await salaryQueue.upsertJobScheduler(
      "salary-expected-current-cycle-daily",
      { pattern: "0 6 * * *" },
      {
        name: jobNames.createExpectedSalary,
        data: {},
      },
    );
    logger.info("salary_queue_jobs_scheduled");
  } catch (error) {
    logger.warn("salary_queue_schedule_failed", { error });
  }
};
