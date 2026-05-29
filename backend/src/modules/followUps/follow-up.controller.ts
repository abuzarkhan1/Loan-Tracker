import { cacheInvalidation } from "../../cache/cache.invalidation";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { followUpService } from "./follow-up.service";

const audit = async (req: Parameters<typeof getAuditRequestMeta>[0], action: "FOLLOW_UP_CREATED" | "FOLLOW_UP_UPDATED" | "FOLLOW_UP_DELETED", entityId: string, value: unknown) => {
  await auditLogService.record({ userId: req.user!.id, action, entityType: "FOLLOW_UP", entityId, newValue: action === "FOLLOW_UP_DELETED" ? undefined : serializeAuditValue(value), oldValue: action === "FOLLOW_UP_DELETED" ? value : undefined, ...getAuditRequestMeta(req) });
};

export const createFollowUp = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await followUpService.create(userId, req.body);
  await cacheInvalidation.communicationChanged(userId);
  await audit(req, "FOLLOW_UP_CREATED", data._id.toString(), data);
  return sendResponse(res, 201, "Follow-up created successfully", data);
});

export const getFollowUps = asyncHandler(async (req, res) => {
  const data = await followUpService.list(req.user!.id, req.query as never);
  return sendResponse(res, 200, "Follow-ups fetched successfully", data);
});

export const getContactFollowUps = asyncHandler(async (req, res) => {
  const data = await followUpService.contact(req.user!.id, String(req.params.contactId));
  return sendResponse(res, 200, "Contact follow-ups fetched successfully", data);
});

export const getLoanFollowUps = asyncHandler(async (req, res) => {
  const data = await followUpService.loan(req.user!.id, String(req.params.loanId));
  return sendResponse(res, 200, "Loan follow-ups fetched successfully", data);
});

export const updateFollowUp = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await followUpService.update(userId, String(req.params.id), req.body);
  await cacheInvalidation.communicationChanged(userId);
  await audit(req, "FOLLOW_UP_UPDATED", data._id.toString(), data);
  return sendResponse(res, 200, "Follow-up updated successfully", data);
});

export const deleteFollowUp = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await followUpService.delete(userId, String(req.params.id));
  await cacheInvalidation.communicationChanged(userId);
  await audit(req, "FOLLOW_UP_DELETED", String(req.params.id), data);
  return sendResponse(res, 200, "Follow-up deleted successfully", data);
});

export const snoozeFollowUp = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await followUpService.snooze(userId, String(req.params.id), req.body.nextFollowUpAt);
  await cacheInvalidation.communicationChanged(userId);
  await audit(req, "FOLLOW_UP_UPDATED", data._id.toString(), data);
  return sendResponse(res, 200, "Follow-up snoozed successfully", data);
});
