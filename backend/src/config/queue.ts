import { JobsOptions, Queue, QueueEvents } from "bullmq";
import { queueRedisOptions } from "./redis";
import { logger } from "./logger";

export const defaultJobOptions: JobsOptions = {
  attempts: 3,
  removeOnComplete: {
    age: 60 * 60 * 24,
    count: 1_000,
  },
  removeOnFail: {
    age: 60 * 60 * 24 * 7,
    count: 5_000,
  },
  backoff: {
    type: "exponential",
    delay: 5_000,
  },
};

export const createQueue = (name: string) =>
  new Queue(name, {
    connection: queueRedisOptions,
    defaultJobOptions,
  });

export const createQueueEvents = (queueName: string) => {
  const events = new QueueEvents(queueName, { connection: queueRedisOptions });

  events.on("completed", ({ jobId }) => {
    logger.info("queue_job_completed", { queueName, jobId });
  });

  events.on("failed", ({ jobId, failedReason }) => {
    logger.error("queue_job_failed", { queueName, jobId, failedReason });
  });

  events.on("error", (error) => {
    logger.error("queue_events_error", { queueName, error });
  });

  return events;
};
