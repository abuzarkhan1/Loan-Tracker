import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { recoveryService } from "./recovery.service";

export const getRecoveryCenter = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.recovery.center(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Recovery center fetched successfully", cached);
  const data = await recoveryService.getCenter(userId);
  await cacheService.set(key, data, cacheTtl.recovery);
  return sendResponse(res, 200, "Recovery center fetched successfully", data);
});
