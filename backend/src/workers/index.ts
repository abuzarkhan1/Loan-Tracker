import { Worker } from "bullmq";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { createNotificationWorker } from "./notification.worker";
import { createReportWorker } from "./report.worker";
import { createCleanupWorker } from "./cleanup.worker";
import { createAuditWorker } from "./audit.worker";
import { createEmailWorker } from "./email.worker";
import { createSalaryWorker } from "./salary.worker";
import { createBillWorker } from "./bill.worker";
import { createRecurringTransactionWorker } from "./recurring-transaction.worker";
import { createAlertWorker } from "./alert.worker";

let workers: Worker[] = [];

const bindWorkerLogging = (worker: Worker) => {
  worker.on("completed", (job) => {
    logger.info("worker_job_completed", {
      queueName: worker.name,
      jobId: job.id,
      jobName: job.name,
    });
  });

  worker.on("failed", (job, error) => {
    logger.error("worker_job_failed", {
      queueName: worker.name,
      jobId: job?.id,
      jobName: job?.name,
      error,
    });
  });

  worker.on("error", (error) => {
    logger.error("worker_error", {
      queueName: worker.name,
      error,
    });
  });
};

export const startWorkers = () => {
  if (!env.QUEUE_WORKERS_ENABLED) {
    logger.info("queue_workers_disabled");
    return;
  }

  workers = [
    createNotificationWorker(),
    createReportWorker(),
    createCleanupWorker(),
    createAuditWorker(),
    createEmailWorker(),
    createSalaryWorker(),
    createBillWorker(),
    createRecurringTransactionWorker(),
    createAlertWorker(),
  ];
  workers.forEach(bindWorkerLogging);
  logger.info("queue_workers_started", { count: workers.length });
};

export const closeWorkers = async () => {
  await Promise.allSettled(workers.map((worker) => worker.close()));
  workers = [];
};
