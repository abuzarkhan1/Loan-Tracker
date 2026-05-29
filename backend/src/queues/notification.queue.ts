import { createQueue, createQueueEvents } from "../config/queue";
import { queueNames } from "../jobs/job.constants";

export const notificationQueue = createQueue(queueNames.notification);
export const notificationQueueEvents = createQueueEvents(queueNames.notification);
