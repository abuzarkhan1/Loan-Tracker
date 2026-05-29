import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { assistantService } from "./assistant.service";

export const askAssistant = asyncHandler(async (req, res) => {
  const data = await assistantService.ask(req.user!.id, req.body.question);
  return sendResponse(res, 200, "Assistant response generated successfully", data);
});
