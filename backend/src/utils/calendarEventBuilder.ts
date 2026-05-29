export type FinanceCalendarEvent = {
  id: string;
  type: string;
  title: string;
  amount?: number;
  date: Date;
  status?: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
  relatedEntityType: string;
  relatedEntityId: string;
  metadata?: Record<string, unknown>;
};

export const calendarSeverity = (status?: string) => {
  if (status === "OVERDUE" || status === "MISSED" || status === "BROKEN") return "DANGER" as const;
  if (status === "DUE_TODAY") return "WARNING" as const;
  if (status === "PAID" || status === "COMPLETED" || status === "RECEIVED") return "SUCCESS" as const;
  return "INFO" as const;
};
