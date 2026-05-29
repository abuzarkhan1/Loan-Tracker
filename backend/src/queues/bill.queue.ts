import { createQueue, createQueueEvents } from "../config/queue";
import { logger } from "../config/logger";
import { jobNames, queueNames } from "../jobs/job.constants";

export const billQueue = createQueue(queueNames.bill);
export const billQueueEvents = createQueueEvents(queueNames.bill);

export const scheduleBillQueueJobs = async () => {
  try {
    await billQueue.upsertJobScheduler(
      "bill-occurrences-daily",
      { pattern: "15 5 * * *" },
      { name: jobNames.generateBillOccurrences, data: {} },
    );
    logger.info("bill_queue_jobs_scheduled");
  } catch (error) {
    logger.warn("bill_queue_schedule_failed", { error });
  }
};
