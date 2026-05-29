import { Types } from "mongoose";
import { logger } from "../../config/logger";
import { isRedisReady, queueRedisConnection } from "../../config/redis";
import { auditQueue } from "../../queues/audit.queue";
import { jobNames } from "../../jobs/job.constants";
import { AuditJobPayload } from "../../jobs/job.types";
import { ApiError } from "../../utils/apiError";
import { buildPaginationMeta } from "../../utils/pagination";
import { AuditAction, AuditEntityType, AuditLogModel } from "./audit-log.model";

type AuditPayload = {
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
};

type AuditLogFilters = {
  action?: AuditAction;
  entityType?: AuditEntityType;
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  limit: number;
};

const toObjectId = (id: string) => new Types.ObjectId(id);

export const auditLogService = {
  async record(payload: AuditPayload) {
    if (isRedisReady(queueRedisConnection)) {
      try {
        await auditQueue.add(jobNames.writeAuditLog, payload, {
          jobId: `${jobNames.writeAuditLog}_${payload.userId}_${payload.action}_${Date.now()}`,
        });
        return;
      } catch (error) {
        logger.warn("audit_queue_enqueue_failed", {
          userId: payload.userId,
          action: payload.action,
          error,
        });
      }
    }

    try {
      await this.writeDirect(payload);
    } catch (error) {
      logger.error("audit_direct_write_failed", {
        userId: payload.userId,
        action: payload.action,
        error,
      });
    }
  },

  async writeDirect(payload: AuditJobPayload) {
    return AuditLogModel.create({
      userId: toObjectId(payload.userId),
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId ? toObjectId(payload.entityId) : undefined,
      oldValue: payload.oldValue,
      newValue: payload.newValue,
      metadata: payload.metadata,
      ip: payload.ip,
      userAgent: payload.userAgent,
    });
  },

  async getAuditLogs(userId: string, filters: AuditLogFilters) {
    const query: Record<string, unknown> = { userId };

    if (filters.action) query.action = filters.action;
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {
        ...(filters.dateFrom ? { $gte: filters.dateFrom } : {}),
        ...(filters.dateTo ? { $lte: filters.dateTo } : {}),
      };
    }

    const limit = Math.min(filters.limit, 100);
    const skip = (filters.page - 1) * limit;
    const [auditLogs, total] = await Promise.all([
      AuditLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLogModel.countDocuments(query),
    ]);

    return {
      auditLogs,
      pagination: buildPaginationMeta(filters.page, limit, total),
    };
  },

  async getAuditLog(userId: string, auditLogId: string) {
    const auditLog = await AuditLogModel.findOne({ _id: auditLogId, userId });
    if (!auditLog) {
      throw new ApiError(404, "Audit log not found");
    }

    return auditLog;
  },
};
