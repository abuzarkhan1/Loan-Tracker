import { Queue, QueueEvents } from "bullmq";
import { logger } from "../config/logger";
import { isRedisReady, queueRedisConnection } from "../config/redis";
import { notificationQueue, notificationQueueEvents } from "./notification.queue";
import { reportQueue, reportQueueEvents } from "./report.queue";
import { cleanupQueue, cleanupQueueEvents } from "./cleanup.queue";
import { auditQueue, auditQueueEvents } from "./audit.queue";

export const queues = {
  notificationQueue,
  reportQueue,
  cleanupQueue,
  auditQueue,
};

const queueEvents: QueueEvents[] = [
  notificationQueueEvents,
  reportQueueEvents,
  cleanupQueueEvents,
  auditQueueEvents,
];

export const getQueueHealth = async () => {
  if (!isRedisReady(queueRedisConnection)) {
    return Object.fromEntries(
      Object.keys(queues).map((name) => [name, { status: "unavailable" }]),
    );
  }

  const entries = await Promise.all(
    Object.entries(queues).map(async ([name, queue]) => {
      try {
        const counts = await queue.getJobCounts("waiting", "active", "completed", "failed", "delayed");
        return [name, { status: "healthy", counts }] as const;
      } catch (error) {
        logger.warn("queue_health_failed", { queueName: name, error });
        return [name, { status: "unavailable" }] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
};

export const closeQueues = async () => {
  const queueList: Queue[] = Object.values(queues);
  await Promise.allSettled([
    ...queueList.map((queue) => queue.close()),
    ...queueEvents.map((events) => events.close()),
  ]);
};
