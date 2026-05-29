import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { reminderService } from "./reminder.service";

export const getReminderSettings = asyncHandler(async (req, res) => {
  const data = await reminderService.getSettings(req.user!.id);
  return sendResponse(res, 200, "Reminder settings fetched successfully", data);
});

export const updateReminderSettings = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await reminderService.updateSettings(userId, req.body);
  await auditLogService.record({
    userId,
    action: "SETTINGS_CHANGED",
    entityType: "SETTINGS",
    entityId: data._id.toString(),
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 200, "Reminder settings updated successfully", data);
});

export const registerPushToken = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await reminderService.registerPushToken(userId, req.body.pushToken, req.body.timezone);
  await auditLogService.record({
    userId,
    action: "SETTINGS_CHANGED",
    entityType: "SETTINGS",
    entityId: data._id.toString(),
    metadata: {
      ...getAuditRequestMeta(req).metadata,
      setting: "pushToken",
    },
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  return sendResponse(res, 200, "Push token registered successfully", data);
});

export const getReminderLogs = asyncHandler(async (req, res) => {
  const data = await reminderService.getNotificationLogs(req.user!.id, req.query as never);
  return sendResponse(res, 200, "Reminder logs fetched successfully", data);
});

export const sendTestReminder = asyncHandler(async (req, res) => {
  const data = await reminderService.sendTestNotification(req.user!.id);
  return sendResponse(res, 201, "Test notification queued successfully", data);
});
