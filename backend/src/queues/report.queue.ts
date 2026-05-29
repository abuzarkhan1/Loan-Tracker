import { createQueue, createQueueEvents } from "../config/queue";
import { queueNames } from "../jobs/job.constants";

export const reportQueue = createQueue(queueNames.report);
export const reportQueueEvents = createQueueEvents(queueNames.report);
