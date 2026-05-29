import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { affordabilityService } from "./affordability.service";

export const checkAffordability = asyncHandler(async (req, res) => {
  const data = await affordabilityService.check(req.user!.id, req.body);
  return sendResponse(res, 200, "Affordability checked successfully", data);
});
