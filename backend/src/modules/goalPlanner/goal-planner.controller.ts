import { cacheInvalidation } from "../../cache/cache.invalidation";
import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { goalPlannerService } from "./goal-planner.service";
import { savingsGoalService } from "../savingsGoals/savings-goal.service";

export const getGoalsPlanner = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.goals.planner(userId);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Goals planner fetched successfully", cached);
  const data = await goalPlannerService.planner(userId);
  await cacheService.set(key, data, cacheTtl.savings);
  return sendResponse(res, 200, "Goals planner fetched successfully", data);
});

export const calculateGoalPlan = asyncHandler(async (req, res) => {
  const data = await goalPlannerService.calculate(req.user!.id, String(req.params.id));
  return sendResponse(res, 200, "Goal plan calculated successfully", data);
});

export const getGoalAutoPlan = asyncHandler(async (req, res) => {
  const data = await goalPlannerService.autoPlan(req.user!.id, String(req.params.id));
  return sendResponse(res, 200, "Goal auto-plan fetched successfully", data);
});

export const generateGoalAutoPlan = asyncHandler(async (req, res) => {
  const data = await goalPlannerService.autoPlan(req.user!.id, String(req.params.id));
  return sendResponse(res, 200, "Goal auto-plan generated successfully", data);
});

export const applyGoalAutoPlan = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await goalPlannerService.applyAutoPlan(userId, String(req.params.id));
  await cacheInvalidation.financeChanged(userId);
  return sendResponse(res, 200, "Goal auto-plan applied successfully", data);
});

export const addGoalProgress = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await savingsGoalService.addProgress(userId, String(req.params.id), req.body);
  await cacheInvalidation.financeChanged(userId);
  return sendResponse(res, 200, "Goal progress added successfully", data);
});

export const pauseGoal = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await goalPlannerService.setStatus(userId, String(req.params.id), "PAUSED");
  await cacheInvalidation.financeChanged(userId);
  return sendResponse(res, 200, "Goal paused successfully", data);
});

export const resumeGoal = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await goalPlannerService.setStatus(userId, String(req.params.id), "ACTIVE");
  await cacheInvalidation.financeChanged(userId);
  return sendResponse(res, 200, "Goal resumed successfully", data);
});
