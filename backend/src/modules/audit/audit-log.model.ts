import mongoose, { Document, Schema, Types } from "mongoose";

export const AUDIT_ACTIONS = [
  "CONTACT_CREATED",
  "CONTACT_IMPORTED",
  "CONTACT_UPDATED",
  "CONTACT_DELETED",
  "CONTACT_FAVORITED",
  "CONTACT_UNFAVORITED",
  "LOAN_CREATED",
  "LOAN_UPDATED",
  "LOAN_DELETED",
  "LOAN_PINNED",
  "LOAN_UNPINNED",
  "PAYMENT_CREATED",
  "PAYMENT_UPDATED",
  "PAYMENT_DELETED",
  "PDF_GENERATED",
  "EXCEL_EXPORTED",
  "RECEIPT_GENERATED",
  "RECEIPT_DELETED",
  "REMINDER_SENT",
  "SETTINGS_CHANGED",
  "BACKUP_CREATED",
  "BACKUP_RESTORED",
  "BACKUP_DELETED",
  "EMAIL_QUEUED",
  "EMAIL_SENT",
  "EMAIL_FAILED",
  "TEMPLATE_CREATED",
  "TEMPLATE_UPDATED",
  "TEMPLATE_DELETED",
  "FOLLOW_UP_CREATED",
  "FOLLOW_UP_UPDATED",
  "FOLLOW_UP_DELETED",
  "PROMISE_CREATED",
  "PROMISE_UPDATED",
  "PROMISE_KEPT",
  "PROMISE_BROKEN",
  "PROMISE_CANCELLED",
  "PAYMENT_REQUEST_CREATED",
  "PAYMENT_REQUEST_SHARED",
  "PAYMENT_REQUEST_CANCELLED",
  "RELATIONSHIP_UPDATED",
  "SETTLEMENT_CREATED",
  "SETTLEMENT_CANCELLED",
  "SETTLEMENT_EMAIL_SENT",
  "CATEGORY_CREATED",
  "CATEGORY_UPDATED",
  "CATEGORY_DELETED",
  "TRANSACTION_CREATED",
  "TRANSACTION_UPDATED",
  "TRANSACTION_DELETED",
  "AUTO_TRANSACTION_CREATED",
  "AUTO_TRANSACTION_UPDATED",
  "AUTO_TRANSACTION_DELETED",
  "SALARY_PROFILE_UPDATED",
  "SALARY_ENTRY_CREATED",
  "SALARY_ENTRY_UPDATED",
  "SALARY_ENTRY_DELETED",
  "SALARY_MARKED_RECEIVED",
  "SALARY_MARKED_MISSED",
  "SALARY_ALLOCATION_CREATED",
  "SALARY_ALLOCATION_UPDATED",
  "SALARY_ALLOCATION_DELETED",
  "BUDGET_CREATED",
  "BUDGET_UPDATED",
  "BUDGET_DELETED",
  "SAVINGS_GOAL_CREATED",
  "SAVINGS_GOAL_UPDATED",
  "SAVINGS_GOAL_DELETED",
  "SAVINGS_PROGRESS_ADDED",
] as const;

export const AUDIT_ENTITY_TYPES = [
  "CONTACT",
  "LOAN",
  "PAYMENT",
  "REPORT",
  "RECEIPT",
  "REMINDER",
  "SETTINGS",
  "BACKUP",
  "EMAIL",
  "TEMPLATE",
  "FOLLOW_UP",
  "PROMISE",
  "PAYMENT_REQUEST",
  "RELATIONSHIP",
  "SETTLEMENT",
  "COMMUNICATION",
  "CATEGORY",
  "TRANSACTION",
  "SALARY_PROFILE",
  "SALARY_ENTRY",
  "SALARY_ALLOCATION",
  "BUDGET",
  "SAVINGS_GOAL",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

export interface IAuditLog extends Document {
  userId: Types.ObjectId;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: Types.ObjectId;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: AUDIT_ENTITY_TYPES,
      required: true,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    oldValue: {
      type: Schema.Types.Mixed,
    },
    newValue: {
      type: Schema.Types.Mixed,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    ip: {
      type: String,
      maxlength: 120,
    },
    userAgent: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true },
);

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, entityType: 1, createdAt: -1 });

export const AuditLogModel = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
