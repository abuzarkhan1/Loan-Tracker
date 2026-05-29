import { Job, Worker } from "bullmq";
import { queueRedisOptions } from "../config/redis";
import { logger } from "../config/logger";
import { queueNames } from "../jobs/job.constants";
import { NotificationJobPayload } from "../jobs/job.types";
import { ReminderType } from "../modules/reminders/reminder.enums";
import { reminderService } from "../modules/reminders/reminder.service";

export const createNotificationWorker = () =>
  new Worker<NotificationJobPayload>(
    queueNames.notification,
    async (job: Job<NotificationJobPayload>) => {
      logger.info("notification_job_started", {
        queueName: queueNames.notification,
        jobId: job.id,
        jobName: job.name,
        userId: job.data.userId,
        loanId: job.data.loanId,
      });

      if (!job.data.notificationLogId && job.data.type === ReminderType.DAILY_SUMMARY) {
        await reminderService.queueDailySummary(job.data.userId);
        return { ok: true };
      }

      if (!job.data.notificationLogId && job.data.type === ReminderType.WEEKLY_SUMMARY) {
        await reminderService.queueWeeklySummary(job.data.userId);
        return { ok: true };
      }

      if (!job.data.notificationLogId && !job.data.loanId && job.data.type === ReminderType.DUE_SOON) {
        await reminderService.queueDueSoonRemindersForUser(job.data.userId);
        return { ok: true };
      }

      if (!job.data.notificationLogId && !job.data.loanId && job.data.type === ReminderType.OVERDUE) {
        await reminderService.queueOverdueRemindersForUser(job.data.userId);
        return { ok: true };
      }

      return reminderService.processNotificationJob(job.data);
    },
    { connection: queueRedisOptions, concurrency: 5 },
  );
