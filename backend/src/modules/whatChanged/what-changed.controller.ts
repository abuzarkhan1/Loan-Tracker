import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { whatChangedService } from "./what-changed.service";

export const getWhatChanged = asyncHandler(async (req, res) => {
  const key = cacheKeys.phase8.whatChanged(req.user!.id);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "What changed insights fetched successfully", cached);
  const data = await whatChangedService.list(req.user!.id);
  await cacheService.set(key, data, cacheTtl.insights);
  return sendResponse(res, 200, "What changed insights fetched successfully", data);
});
