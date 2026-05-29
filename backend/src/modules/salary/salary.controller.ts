import { cacheInvalidation } from "../../cache/cache.invalidation";
import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { salaryService } from "./salary.service";

const audit = async (req: Parameters<typeof getAuditRequestMeta>[0], action: Parameters<typeof auditLogService.record>[0]["action"], entityType: Parameters<typeof auditLogService.record>[0]["entityType"], id: string | undefined, value: unknown) => {
  await auditLogService.record({
    userId: req.user!.id,
    action,
    entityType,
    entityId: id,
    newValue: serializeAuditValue(value),
    ...getAuditRequestMeta(req),
  });
};

export const getSalaryProfile = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.salary.profile(userId);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Salary profile fetched successfully", cached);
  const data = await salaryService.getProfile(userId);
  await cacheService.set(key, data, cacheTtl.salary);
  return sendResponse(res, 200, "Salary profile fetched successfully", data);
});

export const upsertSalaryProfile = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await salaryService.upsertProfile(userId, req.body);
  await cacheInvalidation.financeChanged(userId);
  await audit(req, "SALARY_PROFILE_UPDATED", "SALARY_PROFILE", data._id.toString(), data);
  return sendResponse(res, 200, "Salary profile saved successfully", data);
});

export const createSalaryEntry = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await salaryService.createEntry(userId, req.body);
  await cacheInvalidation.financeChanged(userId);
  await audit(req, "SALARY_ENTRY_CREATED", "SALARY_ENTRY", data._id.toString(), data);
  return sendResponse(res, 201, "Salary entry created successfully", data);
});

export const getSalaryEntries = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.salary.entries(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Salary entries fetched successfully", cached);
  const data = await salaryService.listEntries(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.lists);
  return sendResponse(res, 200, "Salary entries fetched successfully", data);
});

export const getCurrentCycleSalaryEntry = asyncHandler(async (req, res) => {
  const data = await salaryService.getCurrentCycleEntry(req.user!.id);
  return sendResponse(res, 200, "Current cycle salary entry fetched successfully", data);
});

export const getSalaryEntry = asyncHandler(async (req, res) => {
  const data = await salaryService.getEntry(req.user!.id, String(req.params.id));
  return sendResponse(res, 200, "Salary entry fetched successfully", data);
});

export const updateSalaryEntry = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await salaryService.updateEntry(userId, String(req.params.id), req.body);
  await cacheInvalidation.financeChanged(userId);
  await audit(req, "SALARY_ENTRY_UPDATED", "SALARY_ENTRY", data._id.toString(), data);
  return sendResponse(res, 200, "Salary entry updated successfully", data);
});

export const markSalaryReceived = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await salaryService.markReceived(userId, String(req.params.id), req.body);
  await cacheInvalidation.financeChanged(userId);
  await audit(req, "SALARY_MARKED_RECEIVED", "SALARY_ENTRY", data._id.toString(), data);
  return sendResponse(res, 200, "Salary marked received successfully", data);
});

export const markSalaryMissed = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await salaryService.markMissed(userId, String(req.params.id));
  await cacheInvalidation.financeChanged(userId);
  await audit(req, "SALARY_MARKED_MISSED", "SALARY_ENTRY", data._id.toString(), data);
  return sendResponse(res, 200, "Salary marked missed successfully", data);
});

export const deleteSalaryEntry = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await salaryService.deleteEntry(userId, String(req.params.id));
  await cacheInvalidation.financeChanged(userId);
  await audit(req, "SALARY_ENTRY_DELETED", "SALARY_ENTRY", String(req.params.id), data);
  return sendResponse(res, 200, "Salary entry deleted successfully", data);
});

export const getCurrentSalaryCycle = asyncHandler(async (req, res) => {
  const data = await salaryService.getCurrentCycle(req.user!.id, req.query.date ? new Date(String(req.query.date)) : new Date());
  return sendResponse(res, 200, "Current salary cycle fetched successfully", data);
});

export const getSalaryCycleSummary = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.salary.cycle(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Salary cycle summary fetched successfully", cached);
  const data = await salaryService.getCycleSummary(userId, req.query.date ? new Date(String(req.query.date)) : new Date());
  await cacheService.set(key, data, cacheTtl.salary);
  return sendResponse(res, 200, "Salary cycle summary fetched successfully", data);
});

export const getSalaryDashboard = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.salary.dashboard(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Salary dashboard fetched successfully", cached);
  const data = await salaryService.getDashboard(userId);
  await cacheService.set(key, data, cacheTtl.salary);
  return sendResponse(res, 200, "Salary dashboard fetched successfully", data);
});

export const createSalaryAllocation = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await salaryService.createAllocation(userId, req.body);
  await cacheInvalidation.financeChanged(userId);
  await audit(req, "SALARY_ALLOCATION_CREATED", "SALARY_ALLOCATION", data._id.toString(), data);
  return sendResponse(res, 201, "Salary allocation created successfully", data);
});

export const getSalaryAllocations = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.salary.allocations(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Salary allocations fetched successfully", cached);
  const data = await salaryService.listAllocations(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.lists);
  return sendResponse(res, 200, "Salary allocations fetched successfully", data);
});

export const updateSalaryAllocation = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await salaryService.updateAllocation(userId, String(req.params.id), req.body);
  await cacheInvalidation.financeChanged(userId);
  await audit(req, "SALARY_ALLOCATION_UPDATED", "SALARY_ALLOCATION", data._id.toString(), data);
  return sendResponse(res, 200, "Salary allocation updated successfully", data);
});

export const deleteSalaryAllocation = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await salaryService.deleteAllocation(userId, String(req.params.id));
  await cacheInvalidation.financeChanged(userId);
  await audit(req, "SALARY_ALLOCATION_DELETED", "SALARY_ALLOCATION", String(req.params.id), data);
  return sendResponse(res, 200, "Salary allocation deleted successfully", data);
});

export const getSalaryAllocationSummary = asyncHandler(async (req, res) => {
  const data = await salaryService.getAllocationSummary(req.user!.id, req.query.date ? new Date(String(req.query.date)) : new Date());
  return sendResponse(res, 200, "Salary allocation summary fetched successfully", data);
});
