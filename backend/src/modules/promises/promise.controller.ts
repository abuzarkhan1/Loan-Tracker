import { cacheInvalidation } from "../../cache/cache.invalidation";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { promiseService } from "./promise.service";

const audit = async (req: Parameters<typeof getAuditRequestMeta>[0], action: "PROMISE_CREATED" | "PROMISE_UPDATED" | "PROMISE_KEPT" | "PROMISE_BROKEN" | "PROMISE_CANCELLED", id: string, value: unknown) => {
  await auditLogService.record({ userId: req.user!.id, action, entityType: "PROMISE", entityId: id, newValue: serializeAuditValue(value), ...getAuditRequestMeta(req) });
};

export const createPromise = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await promiseService.create(userId, req.body);
  await cacheInvalidation.communicationChanged(userId);
  await audit(req, "PROMISE_CREATED", data._id.toString(), data);
  return sendResponse(res, 201, "Promise created successfully", data);
});

export const getPromises = asyncHandler(async (req, res) => {
  const data = await promiseService.list(req.user!.id, req.query as never);
  return sendResponse(res, 200, "Promises fetched successfully", data);
});

export const getContactPromises = asyncHandler(async (req, res) => {
  const data = await promiseService.contact(req.user!.id, String(req.params.contactId));
  return sendResponse(res, 200, "Contact promises fetched successfully", data);
});

export const getLoanPromises = asyncHandler(async (req, res) => {
  const data = await promiseService.loan(req.user!.id, String(req.params.loanId));
  return sendResponse(res, 200, "Loan promises fetched successfully", data);
});

export const updatePromise = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await promiseService.update(userId, String(req.params.id), req.body);
  await cacheInvalidation.communicationChanged(userId);
  await audit(req, "PROMISE_UPDATED", data._id.toString(), data);
  return sendResponse(res, 200, "Promise updated successfully", data);
});

export const markPromiseKept = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await promiseService.markKept(userId, String(req.params.id));
  await cacheInvalidation.communicationChanged(userId);
  await audit(req, "PROMISE_KEPT", data._id.toString(), data);
  return sendResponse(res, 200, "Promise marked kept successfully", data);
});

export const markPromiseBroken = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await promiseService.markBroken(userId, String(req.params.id));
  await cacheInvalidation.communicationChanged(userId);
  await audit(req, "PROMISE_BROKEN", data._id.toString(), data);
  return sendResponse(res, 200, "Promise marked broken successfully", data);
});

export const cancelPromise = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await promiseService.cancel(userId, String(req.params.id));
  await cacheInvalidation.communicationChanged(userId);
  await audit(req, "PROMISE_CANCELLED", data._id.toString(), data);
  return sendResponse(res, 200, "Promise cancelled successfully", data);
});

export const deletePromise = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await promiseService.delete(userId, String(req.params.id));
  await cacheInvalidation.communicationChanged(userId);
  return sendResponse(res, 200, "Promise deleted successfully", data);
});
