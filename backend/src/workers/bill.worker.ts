import { Job, Worker } from "bullmq";
import { logger } from "../config/logger";
import { queueRedisOptions } from "../config/redis";
import { BillJobPayload } from "../jobs/job.types";
import { queueNames } from "../jobs/job.constants";
import { BillModel } from "../modules/bills/bill.model";
import { billService } from "../modules/bills/bill.service";

export const createBillWorker = () =>
  new Worker<BillJobPayload>(
    queueNames.bill,
    async (job: Job<BillJobPayload>) => {
      logger.info("bill_job_started", { queueName: queueNames.bill, jobId: job.id, jobName: job.name, userId: job.data.userId });
      if (job.data.userId && job.data.billId) {
        await billService.generateOccurrence(job.data.userId, job.data.billId);
        return { processed: 1 };
      }
      const bills = await BillModel.find({ status: "ACTIVE", nextDueDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }).select("userId _id");
      await Promise.allSettled(bills.map((bill) => billService.generateOccurrence(bill.userId.toString(), bill._id.toString())));
      return { processed: bills.length };
    },
    { connection: queueRedisOptions, concurrency: 2 },
  );
