import { cacheInvalidation } from "../../cache/cache.invalidation";
import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { categoryService } from "./category.service";

export const getCategories = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.categories.list(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Categories fetched successfully", cached);
  const data = await categoryService.list(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.lists);
  return sendResponse(res, 200, "Categories fetched successfully", data);
});

export const createCategory = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await categoryService.create(userId, req.body);
  await cacheInvalidation.financeChanged(userId);
  await auditLogService.record({
    userId,
    action: "CATEGORY_CREATED",
    entityType: "CATEGORY",
    entityId: data._id.toString(),
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 201, "Category created successfully", data);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await categoryService.update(userId, String(req.params.id), req.body);
  await cacheInvalidation.financeChanged(userId);
  await auditLogService.record({
    userId,
    action: "CATEGORY_UPDATED",
    entityType: "CATEGORY",
    entityId: data._id.toString(),
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 200, "Category updated successfully", data);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await categoryService.delete(userId, String(req.params.id));
  await cacheInvalidation.financeChanged(userId);
  await auditLogService.record({
    userId,
    action: "CATEGORY_DELETED",
    entityType: "CATEGORY",
    entityId: String(req.params.id),
    oldValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 200, data.deactivated ? "Category deactivated successfully" : "Category deleted successfully", data);
});
