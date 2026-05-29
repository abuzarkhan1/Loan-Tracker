import { createQueue, createQueueEvents } from "../config/queue";
import { queueNames } from "../jobs/job.constants";

export const auditQueue = createQueue(queueNames.audit);
export const auditQueueEvents = createQueueEvents(queueNames.audit);
