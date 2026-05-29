import { Job, Worker } from "bullmq";
import { logger } from "../config/logger";
import { queueRedisOptions } from "../config/redis";
import { RecurringTransactionJobPayload } from "../jobs/job.types";
import { queueNames } from "../jobs/job.constants";
import { RecurringTransactionModel } from "../modules/recurringTransactions/recurring-transaction.model";
import { recurringTransactionService } from "../modules/recurringTransactions/recurring-transaction.service";

export const createRecurringTransactionWorker = () =>
  new Worker<RecurringTransactionJobPayload>(
    queueNames.recurringTransaction,
    async (job: Job<RecurringTransactionJobPayload>) => {
      logger.info("recurring_transaction_job_started", { queueName: queueNames.recurringTransaction, jobId: job.id, jobName: job.name, userId: job.data.userId });
      if (job.data.userId && job.data.recurringTransactionId) {
        await recurringTransactionService.generateOccurrence(job.data.userId, job.data.recurringTransactionId);
        await recurringTransactionService.processDueAutoTransactions(job.data.userId);
        return { processed: 1 };
      }
      const records = await RecurringTransactionModel.find({ status: "ACTIVE", nextRunDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }).select("userId _id");
      await Promise.allSettled(records.map((record) => recurringTransactionService.generateOccurrence(record.userId.toString(), record._id.toString())));
      const auto = await recurringTransactionService.processDueAutoTransactions(job.data.userId);
      return { processed: records.length, autoCreated: auto.processed };
    },
    { connection: queueRedisOptions, concurrency: 2 },
  );
