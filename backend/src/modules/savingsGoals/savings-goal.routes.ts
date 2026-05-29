import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  addSavingsProgress,
  createSavingsGoal,
  deleteSavingsGoal,
  getSavingsGoal,
  getSavingsGoals,
  getSavingsProgress,
  updateSavingsGoal,
} from "./savings-goal.controller";
import {
  addSavingsProgressSchema,
  createSavingsGoalSchema,
  savingsGoalIdSchema,
  savingsGoalListSchema,
  savingsProgressListSchema,
  updateSavingsGoalSchema,
} from "./savings-goal.validation";

const router = Router();

router.use(requireAuth);
router.post("/", validateRequest(createSavingsGoalSchema), createSavingsGoal);
router.get("/", validateRequest(savingsGoalListSchema), getSavingsGoals);
router.get("/:id", validateRequest(savingsGoalIdSchema), getSavingsGoal);
router.patch("/:id", validateRequest(updateSavingsGoalSchema), updateSavingsGoal);
router.delete("/:id", validateRequest(savingsGoalIdSchema), deleteSavingsGoal);
router.get("/:id/progress", validateRequest(savingsProgressListSchema), getSavingsProgress);
router.post("/:id/add-progress", validateRequest(addSavingsProgressSchema), addSavingsProgress);

export default router;
