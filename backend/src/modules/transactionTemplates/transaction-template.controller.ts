import { cacheInvalidation } from "../../cache/cache.invalidation";
import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { transactionTemplateService } from "./transaction-template.service";

const changed = async (userId: string) => cacheInvalidation.financeChanged(userId);

export const createTransactionTemplate = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await transactionTemplateService.create(userId, req.body);
  await changed(userId);
  await auditLogService.record({ userId, action: "TRANSACTION_TEMPLATE_CREATED", entityType: "TRANSACTION_TEMPLATE", entityId: data._id.toString(), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 201, "Transaction template created successfully", data);
});

export const getTransactionTemplates = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.transactionTemplates.list(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Transaction templates fetched successfully", cached);
  const data = await transactionTemplateService.list(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.lists);
  return sendResponse(res, 200, "Transaction templates fetched successfully", data);
});

export const getTransactionTemplate = asyncHandler(async (req, res) => {
  const data = await transactionTemplateService.get(req.user!.id, String(req.params.id));
  return sendResponse(res, 200, "Transaction template fetched successfully", data);
});

export const updateTransactionTemplate = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await transactionTemplateService.update(userId, String(req.params.id), req.body);
  await changed(userId);
  await auditLogService.record({ userId, action: "TRANSACTION_TEMPLATE_UPDATED", entityType: "TRANSACTION_TEMPLATE", entityId: data._id.toString(), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Transaction template updated successfully", data);
});

export const deleteTransactionTemplate = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await transactionTemplateService.delete(userId, String(req.params.id));
  await changed(userId);
  await auditLogService.record({ userId, action: "TRANSACTION_TEMPLATE_DELETED", entityType: "TRANSACTION_TEMPLATE", entityId: String(req.params.id), oldValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Transaction template deleted successfully", data);
});

export const useTransactionTemplate = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await transactionTemplateService.use(userId, String(req.params.id));
  await changed(userId);
  return sendResponse(res, 201, "Transaction created from template successfully", data);
});
