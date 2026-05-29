import { cacheInvalidation } from "../../cache/cache.invalidation";
import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { dataQualityService } from "./data-quality.service";

export const getDataQualityIssues = asyncHandler(async (req, res) => {
  const key = cacheKeys.phase8.dataQuality(req.user!.id);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Data quality issues fetched successfully", cached);
  const data = await dataQualityService.issues(req.user!.id);
  await cacheService.set(key, data, cacheTtl.insights);
  return sendResponse(res, 200, "Data quality issues fetched successfully", data);
});

export const resolveDataQualityIssue = asyncHandler(async (req, res) => {
  const data = await dataQualityService.resolve(req.user!.id, String(req.params.id));
  await cacheInvalidation.financeChanged(req.user!.id);
  return sendResponse(res, 200, "Data quality issue resolved successfully", data);
});
