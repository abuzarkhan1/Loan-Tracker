import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { categorizationService } from "./categorization.service";

export const suggestCategorization = asyncHandler(async (req, res) => {
  const data = await categorizationService.suggest(req.user!.id, req.body);
  return sendResponse(res, 200, "Category suggestion generated successfully", data);
});

export const saveCategorizationFeedback = asyncHandler(async (req, res) => {
  const data = await categorizationService.feedback(req.user!.id, req.body);
  return sendResponse(res, 200, "Category feedback saved successfully", data);
});
