export const RECURRENCE_FREQUENCIES = ["ONCE", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const endOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const addMonthsKeepingDay = (date: Date, months: number) => {
  const originalDay = date.getDate();
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  next.setDate(Math.min(originalDay, daysInMonth(next.getFullYear(), next.getMonth())));
  return next;
};

export const addFrequency = (date: Date, frequency: RecurrenceFrequency, customDays?: number) => {
  const next = new Date(date);
  if (frequency === "ONCE") return next;
  if (frequency === "WEEKLY") next.setDate(next.getDate() + 7);
  if (frequency === "MONTHLY") return addMonthsKeepingDay(next, 1);
  if (frequency === "QUARTERLY") return addMonthsKeepingDay(next, 3);
  if (frequency === "YEARLY") return addMonthsKeepingDay(next, 12);
  if (frequency === "CUSTOM") next.setDate(next.getDate() + Math.max(customDays || 1, 1));
  return next;
};

export const occurrenceStatus = (
  dueDate: Date,
  paid: boolean,
  statusNames: { paid: string; upcoming: string; dueToday: string; overdue: string },
) => {
  if (paid) return statusNames.paid;
  const due = startOfDay(dueDate).getTime();
  const today = startOfDay(new Date()).getTime();
  if (due < today) return statusNames.overdue;
  if (due === today) return statusNames.dueToday;
  return statusNames.upcoming;
};

export const dateRangeFromQuery = (query: { startDate?: Date; endDate?: Date; dateFrom?: Date; dateTo?: Date }) => {
  const now = new Date();
  return {
    start: startOfDay(query.startDate || query.dateFrom || new Date(now.getFullYear(), now.getMonth(), 1)),
    end: endOfDay(query.endDate || query.dateTo || new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

export const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();
