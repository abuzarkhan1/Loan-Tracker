import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { addSavingsProgressSchema } from "../savingsGoals/savings-goal.validation";
import { addGoalProgress, applyGoalAutoPlan, calculateGoalPlan, generateGoalAutoPlan, getGoalAutoPlan, getGoalsPlanner, pauseGoal, resumeGoal } from "./goal-planner.controller";
import { goalIdSchema } from "./goal-planner.validation";

const router = Router();

router.use(requireAuth);
router.get("/planner", getGoalsPlanner);
router.get("/:id/plan", validateRequest(goalIdSchema), getGoalAutoPlan);
router.post("/:id/auto-plan", validateRequest(goalIdSchema), generateGoalAutoPlan);
router.post("/:id/apply-auto-plan", validateRequest(goalIdSchema), applyGoalAutoPlan);
router.post("/:id/calculate-plan", validateRequest(goalIdSchema), calculateGoalPlan);
router.post("/:id/add-progress", validateRequest(addSavingsProgressSchema), addGoalProgress);
router.patch("/:id/pause", validateRequest(goalIdSchema), pauseGoal);
router.patch("/:id/resume", validateRequest(goalIdSchema), resumeGoal);

export default router;
