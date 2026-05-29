import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { scenarioService } from "./scenario.service";

export const simulateScenario = asyncHandler(async (req, res) => sendResponse(res, 200, "Scenario simulated successfully", await scenarioService.simulate(req.user!.id, req.body)));
export const getScenarioHistory = asyncHandler(async (req, res) => sendResponse(res, 200, "Scenario history fetched successfully", await scenarioService.history(req.user!.id)));
export const deleteScenario = asyncHandler(async (req, res) => sendResponse(res, 200, "Scenario deleted successfully", await scenarioService.delete(req.user!.id, String(req.params.id))));
