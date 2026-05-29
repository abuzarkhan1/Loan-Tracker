import { createQueue, createQueueEvents } from "../config/queue";
import { queueNames } from "../jobs/job.constants";

export const emailQueue = createQueue(queueNames.email);
export const emailQueueEvents = createQueueEvents(queueNames.email);
