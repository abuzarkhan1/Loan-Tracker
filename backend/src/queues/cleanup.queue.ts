import { createQueue, createQueueEvents } from "../config/queue";
import { queueNames } from "../jobs/job.constants";

export const cleanupQueue = createQueue(queueNames.cleanup);
export const cleanupQueueEvents = createQueueEvents(queueNames.cleanup);
