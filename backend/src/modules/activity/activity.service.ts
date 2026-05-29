import { Types } from "mongoose";
import { buildPaginationMeta } from "../../utils/pagination";
import { AuditLogModel } from "../audit/audit-log.model";

type ActivityFilters = {
  type?: string;
  contactId?: string;
  search?: string;
  page: number;
  limit: number;
};

const actionCopy: Record<string, { title: string; severity: "INFO" | "SUCCESS" | "WARNING" | "DANGER" }> = {
  LOAN_CREATED: { title: "Loan created", severity: "INFO" },
  LOAN_UPDATED: { title: "Loan updated", severity: "INFO" },
  LOAN_DELETED: { title: "Loan deleted", severity: "DANGER" },
  PAYMENT_CREATED: { title: "Payment added", severity: "SUCCESS" },
  PAYMENT_UPDATED: { title: "Payment updated", severity: "INFO" },
  PAYMENT_DELETED: { title: "Payment deleted", severity: "WARNING" },
  CONTACT_CREATED: { title: "Contact created", severity: "INFO" },
  CONTACT_IMPORTED: { title: "Contact imported", severity: "SUCCESS" },
  CONTACT_UPDATED: { title: "Contact updated", severity: "INFO" },
  RECEIPT_GENERATED: { title: "Receipt generated", severity: "SUCCESS" },
  PDF_GENERATED: { title: "PDF generated", severity: "SUCCESS" },
  EXCEL_EXPORTED: { title: "Excel exported", severity: "SUCCESS" },
  REMINDER_SENT: { title: "Reminder sent", severity: "INFO" },
};

const getEntityId = (value: unknown) => {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (record.contactId) return String(record.contactId);
  if (record.contact && typeof record.contact === "object" && "_id" in record.contact) {
    return String((record.contact as { _id: unknown })._id);
  }
  return undefined;
};

export const activityService = {
  async getRecentActivity(userId: string, filters: ActivityFilters) {
    const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (filters.type) query.action = filters.type;

    const limit = Math.min(filters.limit, 100);
    const skip = (filters.page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLogModel.countDocuments(query),
    ]);

    const activities = logs
      .map((log) => {
        const titleMeta = actionCopy[log.action] || { title: log.action.replace(/_/g, " ").toLowerCase(), severity: "INFO" as const };
        const contactId = getEntityId(log.newValue) || getEntityId(log.oldValue) || (log.entityType === "CONTACT" && log.entityId ? log.entityId.toString() : undefined);
        const description = log.entityType === "CONTACT" && log.newValue && typeof log.newValue === "object" && "name" in log.newValue
          ? String((log.newValue as { name?: string }).name)
          : `${log.entityType.toLowerCase()} activity`;

        return {
          id: log._id.toString(),
          type: log.action,
          title: titleMeta.title,
          description,
          entityType: log.entityType,
          entityId: log.entityId?.toString(),
          contactId,
          createdAt: log.createdAt,
          icon: log.entityType.toLowerCase(),
          severity: titleMeta.severity,
        };
      })
      .filter((item) => !filters.contactId || item.contactId === filters.contactId)
      .filter((item) => !filters.search || `${item.title} ${item.description}`.toLowerCase().includes(filters.search.toLowerCase()));

    return {
      activities,
      pagination: buildPaginationMeta(filters.page, limit, total),
    };
  },
};
