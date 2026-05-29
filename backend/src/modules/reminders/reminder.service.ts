import { Types } from "mongoose";
import { logger } from "../../config/logger";
import { isRedisReady, queueRedisConnection } from "../../config/redis";
import { jobNames } from "../../jobs/job.constants";
import { NotificationJobPayload } from "../../jobs/job.types";
import { notificationQueue } from "../../queues/notification.queue";
import { ApiError } from "../../utils/apiError";
import { buildPaginationMeta } from "../../utils/pagination";
import { dashboardService } from "../dashboard/dashboard.service";
import { LoanModel } from "../loans/loan.model";
import { NotificationLogModel } from "./notification-log.model";
import { LoanReminderFrequency, LoanReminderModel, LoanReminderTone } from "./loan-reminder.model";
import { NotificationStatus, ReminderType, WeekDay } from "./reminder.enums";
import { IReminderSettings, ReminderSettingsModel } from "./reminder-settings.model";

type SettingsPayload = Partial<{
  dueSoonEnabled: boolean;
  dueSoonDaysBefore: number;
  overdueEnabled: boolean;
  dailySummaryEnabled: boolean;
  dailySummaryTime: string;
  weeklySummaryEnabled: boolean;
  weeklySummaryDay: WeekDay;
  weeklySummaryTime: string;
  pushToken: string;
  timezone: string;
}>;

type NotificationLogFilters = {
  type?: ReminderType;
  status?: NotificationStatus;
  page: number;
  limit: number;
};

type LoanReminderPayload = Partial<{
  enabled: boolean;
  remindBeforeDays: number;
  repeatUntilPaid: boolean;
  repeatFrequency: LoanReminderFrequency;
  tone: LoanReminderTone;
  customMessage: string;
}>;

const toObjectId = (id: string) => new Types.ObjectId(id);

const schedulerIds = {
  dueSoon: (userId: string) => `due-soon-scan:${userId}`,
  overdue: (userId: string) => `overdue-scan:${userId}`,
  daily: (userId: string) => `daily-summary:${userId}`,
  weekly: (userId: string) => `weekly-summary:${userId}`,
};

const cronFromTime = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return `${minute} ${hour} * * *`;
};

const weeklyCronFromTime = (day: WeekDay, time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  const dayIndex = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].indexOf(day);
  return `${minute} ${hour} * * ${dayIndex}`;
};

const calculateLoanReminderDate = (dueDate?: Date, remindBeforeDays = 1, snoozedUntil?: Date) => {
  if (snoozedUntil && snoozedUntil.getTime() > Date.now()) return snoozedUntil;
  if (!dueDate) return undefined;
  const date = new Date(dueDate);
  date.setDate(date.getDate() - remindBeforeDays);
  date.setHours(9, 0, 0, 0);
  return date;
};

const buildLoanReminderMessage = (contactName: string, amount: number, tone: LoanReminderTone, customMessage?: string) => {
  if (customMessage) return customMessage;
  if (tone === "POLITE") return `Salam, ${contactName} ka Rs ${amount} loan reminder hai. Jab easy ho update kar dein.`;
  if (tone === "STRICT") return `${contactName} ka Rs ${amount} loan due hai. Please payment timeline confirm karein.`;
  return `${contactName} ka Rs ${amount} loan due reminder.`;
};

const buildSummaryText = async (userId: string) => {
  const summary = await dashboardService.getSummary(userId);
  return `Lene hain: Rs ${summary.netReceivable}. Dene hain: Rs ${summary.netPayable}. Overall balance: Rs ${summary.overallBalance}.`;
};

const getExpoPushError = (value: unknown) => {
  if (value && typeof value === "object" && "message" in value) {
    return String((value as { message: unknown }).message);
  }

  return "Expo push notification failed";
};

export const reminderService = {
  async getSettings(userId: string) {
    return ReminderSettingsModel.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId: toObjectId(userId) } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  },

  async updateSettings(userId: string, payload: SettingsPayload) {
    const settings = await ReminderSettingsModel.findOneAndUpdate(
      { userId },
      {
        $set: payload,
        $setOnInsert: { userId: toObjectId(userId) },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    );

    await this.syncSummarySchedulers(settings);
    return settings;
  },

  async registerPushToken(userId: string, pushToken: string, timezone?: string) {
    return this.updateSettings(userId, {
      pushToken,
      ...(timezone ? { timezone } : {}),
    });
  },

  async getNotificationLogs(userId: string, filters: NotificationLogFilters) {
    const query: Record<string, unknown> = { userId };
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;

    const limit = Math.min(filters.limit, 100);
    const skip = (filters.page - 1) * limit;
    const [logs, total] = await Promise.all([
      NotificationLogModel.find(query)
        .populate({
          path: "loanId",
          select: "amount remainingAmount status dueDate contactId",
          populate: { path: "contactId", select: "name phone" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      NotificationLogModel.countDocuments(query),
    ]);

    return {
      logs,
      pagination: buildPaginationMeta(filters.page, limit, total),
    };
  },

  async getLoanReminder(userId: string, loanId: string) {
    const loan = await LoanModel.findOne({ _id: loanId, userId });
    if (!loan) throw new ApiError(404, "Loan not found");

    return LoanReminderModel.findOneAndUpdate(
      { userId: toObjectId(userId), loanId: toObjectId(loanId) },
      {
        $setOnInsert: {
          userId: toObjectId(userId),
          loanId: toObjectId(loanId),
          nextReminderAt: calculateLoanReminderDate(loan.dueDate, 1),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  },

  async updateLoanReminder(userId: string, loanId: string, payload: LoanReminderPayload) {
    const loan = await LoanModel.findOne({ _id: loanId, userId });
    if (!loan) throw new ApiError(404, "Loan not found");

    const nextReminderAt = calculateLoanReminderDate(
      loan.dueDate,
      payload.remindBeforeDays ?? undefined,
    );
    const reminder = await LoanReminderModel.findOneAndUpdate(
      { userId: toObjectId(userId), loanId: toObjectId(loanId) },
      {
        $set: {
          ...payload,
          ...(nextReminderAt ? { nextReminderAt } : {}),
        },
        $setOnInsert: { userId: toObjectId(userId), loanId: toObjectId(loanId) },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    );

    await this.syncLoanReminderScheduler(userId, loanId);
    return reminder;
  },

  async snoozeLoanReminder(userId: string, loanId: string, snoozedUntil: Date) {
    const reminder = await this.updateLoanReminder(userId, loanId, {});
    reminder.snoozedUntil = snoozedUntil;
    reminder.nextReminderAt = snoozedUntil;
    await reminder.save();
    await this.syncLoanReminderScheduler(userId, loanId);
    return reminder;
  },

  async previewLoanReminderMessage(userId: string, loanId: string) {
    const [loan, reminder] = await Promise.all([
      LoanModel.findOne({ _id: loanId, userId }).populate("contactId", "name"),
      this.getLoanReminder(userId, loanId),
    ]);
    if (!loan) throw new ApiError(404, "Loan not found");
    const contactName = loan.contactId && typeof loan.contactId === "object" && "name" in loan.contactId
      ? String((loan.contactId as { name?: string }).name || "Contact")
      : "Contact";
    return {
      title: "Loan Reminder",
      body: buildLoanReminderMessage(contactName, loan.remainingAmount, reminder.tone, reminder.customMessage),
      nextReminderAt: reminder.nextReminderAt,
    };
  },

  async testLoanReminder(userId: string, loanId: string) {
    const preview = await this.previewLoanReminderMessage(userId, loanId);
    return this.enqueueNotification({
      userId,
      loanId,
      type: ReminderType.CUSTOM,
      title: preview.title,
      body: preview.body,
      scheduledFor: new Date().toISOString(),
    });
  },

  async createNotification(payload: NotificationJobPayload) {
    return NotificationLogModel.create({
      userId: toObjectId(payload.userId),
      loanId: payload.loanId ? toObjectId(payload.loanId) : undefined,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      status: NotificationStatus.PENDING,
      scheduledFor: payload.scheduledFor ? new Date(payload.scheduledFor) : new Date(),
    });
  },

  async enqueueNotification(payload: NotificationJobPayload, delayMs = 0) {
    const log = await this.createNotification(payload);
    const jobPayload = {
      ...payload,
      notificationLogId: log._id.toString(),
    };

    if (isRedisReady(queueRedisConnection)) {
      await notificationQueue.add(this.getJobName(payload.type), jobPayload, {
        delay: Math.max(delayMs, 0),
      });
      return log;
    }

    await this.processNotificationJob(jobPayload);
    return NotificationLogModel.findById(log._id);
  },

  async sendTestNotification(userId: string) {
    return this.enqueueNotification({
      userId,
      type: ReminderType.CUSTOM,
      title: "Loan Tracker Test",
      body: "Notifications are ready for your Loan Tracker account.",
      scheduledFor: new Date().toISOString(),
    });
  },

  async processNotificationJob(payload: NotificationJobPayload) {
    const settings = await this.getSettings(payload.userId);
    const existingLog = payload.notificationLogId
      ? await NotificationLogModel.findOne({ _id: payload.notificationLogId, userId: payload.userId })
      : null;
    const log = existingLog || await this.createNotification(payload);

    if (!settings.pushToken) {
      await this.markFailed(log._id.toString(), "Push token is not registered");
      return { sent: false };
    }

    try {
      await this.sendExpoPush(settings.pushToken, payload.title, payload.body);
      await NotificationLogModel.findByIdAndUpdate(log._id, {
        $set: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          error: undefined,
        },
      });
      return { sent: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.markFailed(log._id.toString(), message);
      throw error;
    }
  },

  async queueDailySummary(userId: string) {
    const body = await buildSummaryText(userId);
    return this.enqueueNotification({
      userId,
      type: ReminderType.DAILY_SUMMARY,
      title: "Aaj ka loan summary",
      body,
      scheduledFor: new Date().toISOString(),
    });
  },

  async queueWeeklySummary(userId: string) {
    const body = await buildSummaryText(userId);
    return this.enqueueNotification({
      userId,
      type: ReminderType.WEEKLY_SUMMARY,
      title: "Weekly loan summary",
      body,
      scheduledFor: new Date().toISOString(),
    });
  },

  async queueDueSoonReminder(userId: string, loanId: string) {
    const loan = await LoanModel.findOne({ _id: loanId, userId }).populate("contactId", "name");
    if (!loan) return null;
    const contactName = loan.contactId && typeof loan.contactId === "object" && "name" in loan.contactId
      ? String((loan.contactId as { name?: string }).name || "Contact")
      : "Contact";

    return this.enqueueNotification({
      userId,
      loanId,
      type: ReminderType.DUE_SOON,
      title: "Loan due soon",
      body: `${contactName} ka Rs ${loan.remainingAmount} loan due soon hai.`,
      scheduledFor: new Date().toISOString(),
    });
  },

  async queueDueSoonRemindersForUser(userId: string) {
    const settings = await this.getSettings(userId);
    if (!settings.dueSoonEnabled) return [];

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + settings.dueSoonDaysBefore);
    end.setHours(23, 59, 59, 999);

    const loans = await LoanModel.find({
      userId,
      remainingAmount: { $gt: 0 },
      dueDate: { $gte: start, $lte: end },
    }).select("_id");

    return Promise.all(loans.map((loan) => this.queueDueSoonReminder(userId, loan._id.toString())));
  },

  async queueOverdueReminder(userId: string, loanId: string) {
    const loan = await LoanModel.findOne({ _id: loanId, userId }).populate("contactId", "name");
    if (!loan) return null;
    const contactName = loan.contactId && typeof loan.contactId === "object" && "name" in loan.contactId
      ? String((loan.contactId as { name?: string }).name || "Contact")
      : "Contact";

    return this.enqueueNotification({
      userId,
      loanId,
      type: ReminderType.OVERDUE,
      title: "Loan overdue",
      body: `${contactName} ka Rs ${loan.remainingAmount} loan overdue ho gaya hai.`,
      scheduledFor: new Date().toISOString(),
    });
  },

  async queueOverdueRemindersForUser(userId: string) {
    const settings = await this.getSettings(userId);
    if (!settings.overdueEnabled) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const loans = await LoanModel.find({
      userId,
      remainingAmount: { $gt: 0 },
      dueDate: { $lt: today },
    }).select("_id");

    return Promise.all(loans.map((loan) => this.queueOverdueReminder(userId, loan._id.toString())));
  },

  async syncSummarySchedulers(settings: IReminderSettings) {
    if (!isRedisReady(queueRedisConnection)) return;

    const userId = settings.userId.toString();

    if (settings.dueSoonEnabled) {
      await notificationQueue.upsertJobScheduler(
        schedulerIds.dueSoon(userId),
        { pattern: "0 8 * * *", tz: settings.timezone },
        {
          name: jobNames.dueSoonReminder,
          data: {
            userId,
            type: ReminderType.DUE_SOON,
            title: "Due soon scan",
            body: "Checking due soon loans.",
          },
        },
      );
    } else {
      await notificationQueue.removeJobScheduler(schedulerIds.dueSoon(userId));
    }

    if (settings.overdueEnabled) {
      await notificationQueue.upsertJobScheduler(
        schedulerIds.overdue(userId),
        { pattern: "30 8 * * *", tz: settings.timezone },
        {
          name: jobNames.overdueReminder,
          data: {
            userId,
            type: ReminderType.OVERDUE,
            title: "Overdue scan",
            body: "Checking overdue loans.",
          },
        },
      );
    } else {
      await notificationQueue.removeJobScheduler(schedulerIds.overdue(userId));
    }

    if (settings.dailySummaryEnabled) {
      await notificationQueue.upsertJobScheduler(
        schedulerIds.daily(userId),
        { pattern: cronFromTime(settings.dailySummaryTime), tz: settings.timezone },
        {
          name: jobNames.dailySummary,
          data: {
            userId,
            type: ReminderType.DAILY_SUMMARY,
            title: "Aaj ka loan summary",
            body: "Daily summary is being prepared.",
          },
        },
      );
    } else {
      await notificationQueue.removeJobScheduler(schedulerIds.daily(userId));
    }

    if (settings.weeklySummaryEnabled) {
      await notificationQueue.upsertJobScheduler(
        schedulerIds.weekly(userId),
        { pattern: weeklyCronFromTime(settings.weeklySummaryDay, settings.weeklySummaryTime), tz: settings.timezone },
        {
          name: jobNames.weeklySummary,
          data: {
            userId,
            type: ReminderType.WEEKLY_SUMMARY,
            title: "Weekly loan summary",
            body: "Weekly summary is being prepared.",
          },
        },
      );
    } else {
      await notificationQueue.removeJobScheduler(schedulerIds.weekly(userId));
    }
  },

  async syncLoanReminderScheduler(userId: string, loanId: string) {
    if (!isRedisReady(queueRedisConnection)) return;

    const [reminder, loan] = await Promise.all([
      LoanReminderModel.findOne({ userId, loanId }),
      LoanModel.findOne({ _id: loanId, userId }),
    ]);
    if (!reminder || !loan || !reminder.enabled || loan.remainingAmount <= 0 || !reminder.nextReminderAt) {
      await notificationQueue.remove(`loan-reminder:${userId}:${loanId}`);
      return;
    }

    const preview = await this.previewLoanReminderMessage(userId, loanId);
    await notificationQueue.add(
      jobNames.dueSoonReminder,
      {
        userId,
        loanId,
        type: ReminderType.CUSTOM,
        title: preview.title,
        body: preview.body,
        scheduledFor: reminder.nextReminderAt.toISOString(),
      },
      {
        jobId: `loan-reminder:${userId}:${loanId}`,
        delay: Math.max(0, reminder.nextReminderAt.getTime() - Date.now()),
      },
    );
  },

  getJobName(type: ReminderType) {
    if (type === ReminderType.DUE_SOON) return jobNames.dueSoonReminder;
    if (type === ReminderType.OVERDUE) return jobNames.overdueReminder;
    if (type === ReminderType.DAILY_SUMMARY) return jobNames.dailySummary;
    if (type === ReminderType.WEEKLY_SUMMARY) return jobNames.weeklySummary;
    return jobNames.dueSoonReminder;
  },

  async markFailed(notificationLogId: string, error: string) {
    await NotificationLogModel.findByIdAndUpdate(notificationLogId, {
      $set: {
        status: NotificationStatus.FAILED,
        error,
      },
    });
  },

  async sendExpoPush(pushToken: string, title: string, body: string) {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: pushToken,
        sound: "default",
        title,
        body,
        data: { source: "loan-tracker" },
      }),
    });

    if (!response.ok) {
      throw new Error(`Expo push request failed with ${response.status}`);
    }

    const result = await response.json() as { data?: { status?: string; message?: string } };
    if (result.data?.status === "error") {
      throw new Error(getExpoPushError(result.data));
    }
  },
};
