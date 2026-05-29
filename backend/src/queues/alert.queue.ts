import { createQueue, createQueueEvents } from "../config/queue";
import { logger } from "../config/logger";
import { jobNames, queueNames } from "../jobs/job.constants";

export const alertQueue = createQueue(queueNames.alert);
export const alertQueueEvents = createQueueEvents(queueNames.alert);

export const scheduleAlertQueueJobs = async () => {
  try {
    await alertQueue.upsertJobScheduler(
      "smart-alerts-daily",
      { pattern: "45 6 * * *" },
      { name: jobNames.evaluateAlerts, data: {} },
    );
    logger.info("alert_queue_jobs_scheduled");
  } catch (error) {
    logger.warn("alert_queue_schedule_failed", { error });
  }
};
