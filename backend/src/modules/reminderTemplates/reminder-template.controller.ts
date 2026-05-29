import { cacheInvalidation } from "../../cache/cache.invalidation";
import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { reminderTemplateService } from "./reminder-template.service";

export const getReminderTemplates = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.reminderTemplates.list(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Reminder templates fetched successfully", cached);
  const data = await reminderTemplateService.getTemplates(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.lists);
  return sendResponse(res, 200, "Reminder templates fetched successfully", data);
});

export const createReminderTemplate = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await reminderTemplateService.createTemplate(userId, req.body);
  await cacheService.delByPattern(cacheKeys.reminderTemplates.pattern(userId));
  await auditLogService.record({ userId, action: "TEMPLATE_CREATED", entityType: "TEMPLATE", entityId: data._id.toString(), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 201, "Reminder template created successfully", data);
});

export const updateReminderTemplate = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await reminderTemplateService.updateTemplate(userId, String(req.params.id), req.body);
  await cacheService.delByPattern(cacheKeys.reminderTemplates.pattern(userId));
  await auditLogService.record({ userId, action: "TEMPLATE_UPDATED", entityType: "TEMPLATE", entityId: data._id.toString(), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Reminder template updated successfully", data);
});

export const deleteReminderTemplate = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await reminderTemplateService.deleteTemplate(userId, String(req.params.id));
  await cacheService.delByPattern(cacheKeys.reminderTemplates.pattern(userId));
  await auditLogService.record({ userId, action: "TEMPLATE_DELETED", entityType: "TEMPLATE", entityId: String(req.params.id), oldValue: data, ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Reminder template deleted successfully", data);
});

export const previewReminderTemplate = asyncHandler(async (req, res) => {
  const data = await reminderTemplateService.preview(req.user!.id, req.body);
  return sendResponse(res, 200, "Reminder template preview rendered successfully", data);
});
