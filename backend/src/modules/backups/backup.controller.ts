import { cacheInvalidation } from "../../cache/cache.invalidation";
import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { backupService } from "./backup.service";

export const createBackup = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await backupService.createBackup(userId);
  await cacheInvalidation.backupChanged(userId);
  await auditLogService.record({
    userId,
    action: "BACKUP_CREATED",
    entityType: "BACKUP",
    entityId: data._id.toString(),
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 201, "Backup created successfully", data);
});

export const getBackups = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.backups.list(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) {
    return sendResponse(res, 200, "Backups fetched successfully", cached);
  }

  const data = await backupService.getBackups(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.lists);
  return sendResponse(res, 200, "Backups fetched successfully", data);
});

export const getBackup = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const backupId = String(req.params.backupId);
  const key = cacheKeys.backups.detail(userId, backupId);
  const cached = await cacheService.get(key);
  if (cached) {
    return sendResponse(res, 200, "Backup fetched successfully", cached);
  }

  const data = await backupService.getBackup(userId, backupId);
  await cacheService.set(key, data, cacheTtl.loanDetail);
  return sendResponse(res, 200, "Backup fetched successfully", data);
});

export const restoreBackup = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const backupId = String(req.params.backupId);
  const data = await backupService.restoreBackup(userId, backupId, req.body.mode);
  await cacheInvalidation.userChanged(userId);
  await auditLogService.record({
    userId,
    action: "BACKUP_RESTORED",
    entityType: "BACKUP",
    entityId: backupId,
    newValue: data,
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 200, "Backup restored successfully", data);
});

export const deleteBackup = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const backupId = String(req.params.backupId);
  const data = await backupService.deleteBackup(userId, backupId);
  await cacheInvalidation.backupChanged(userId);
  await auditLogService.record({
    userId,
    action: "BACKUP_DELETED",
    entityType: "BACKUP",
    entityId: backupId,
    oldValue: data,
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 200, "Backup deleted successfully", data);
});
