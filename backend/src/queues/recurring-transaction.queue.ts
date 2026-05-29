import { createQueue, createQueueEvents } from "../config/queue";
import { logger } from "../config/logger";
import { jobNames, queueNames } from "../jobs/job.constants";

export const recurringTransactionQueue = createQueue(queueNames.recurringTransaction);
export const recurringTransactionQueueEvents = createQueueEvents(queueNames.recurringTransaction);

export const scheduleRecurringTransactionQueueJobs = async () => {
  try {
    await recurringTransactionQueue.upsertJobScheduler(
      "recurring-transactions-daily",
      { pattern: "25 5 * * *" },
      { name: jobNames.generateRecurringOccurrences, data: {} },
    );
    logger.info("recurring_transaction_queue_jobs_scheduled");
  } catch (error) {
    logger.warn("recurring_transaction_queue_schedule_failed", { error });
  }
};
