import { cacheInvalidation } from "../../cache/cache.invalidation";
import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { billService } from "./bill.service";

const changed = async (userId: string) => cacheInvalidation.financeChanged(userId);

export const createBill = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await billService.create(userId, req.body);
  await changed(userId);
  await auditLogService.record({ userId, action: "BILL_CREATED", entityType: "BILL", entityId: data._id.toString(), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 201, "Bill created successfully", data);
});

export const getBills = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.bills.list(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Bills fetched successfully", cached);
  const data = await billService.list(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.lists);
  return sendResponse(res, 200, "Bills fetched successfully", data);
});

export const getBill = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await billService.get(userId, String(req.params.id));
  return sendResponse(res, 200, "Bill fetched successfully", data);
});

export const updateBill = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await billService.update(userId, String(req.params.id), req.body);
  await changed(userId);
  await auditLogService.record({ userId, action: "BILL_UPDATED", entityType: "BILL", entityId: data._id.toString(), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Bill updated successfully", data);
});

export const deleteBill = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await billService.delete(userId, String(req.params.id));
  await changed(userId);
  await auditLogService.record({ userId, action: "BILL_DELETED", entityType: "BILL", entityId: String(req.params.id), oldValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Bill deleted successfully", data);
});

export const pauseBill = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await billService.setStatus(userId, String(req.params.id), "PAUSED");
  await changed(userId);
  return sendResponse(res, 200, "Bill paused successfully", data);
});

export const resumeBill = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await billService.setStatus(userId, String(req.params.id), "ACTIVE");
  await changed(userId);
  return sendResponse(res, 200, "Bill resumed successfully", data);
});

export const generateBillOccurrence = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await billService.generateOccurrence(userId, String(req.params.id));
  await changed(userId);
  return sendResponse(res, 201, "Bill occurrence generated successfully", data);
});

export const getBillOccurrences = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await billService.occurrences(userId, String(req.params.id), req.query as never);
  return sendResponse(res, 200, "Bill occurrences fetched successfully", data);
});

export const markBillOccurrencePaid = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await billService.markPaid(userId, String(req.params.id), req.body);
  await changed(userId);
  await auditLogService.record({ userId, action: "BILL_OCCURRENCE_PAID", entityType: "BILL_OCCURRENCE", entityId: String(req.params.id), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Bill marked paid successfully", data);
});

export const skipBillOccurrence = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await billService.skip(userId, String(req.params.id));
  await changed(userId);
  await auditLogService.record({ userId, action: "BILL_OCCURRENCE_SKIPPED", entityType: "BILL_OCCURRENCE", entityId: String(req.params.id), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Bill skipped successfully", data);
});

export const getUpcomingBills = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.bills.upcoming(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Upcoming bills fetched successfully", cached);
  const data = await billService.upcoming(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.finance);
  return sendResponse(res, 200, "Upcoming bills fetched successfully", data);
});

export const getOverdueBills = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await billService.overdue(userId);
  return sendResponse(res, 200, "Overdue bills fetched successfully", data);
});
