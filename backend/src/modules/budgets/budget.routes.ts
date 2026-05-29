import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { applyBudgetRecommendations, createBudget, deleteBudget, getBudgetRecommendations, getBudgets, getCurrentBudget, updateBudget } from "./budget.controller";
import { applyBudgetRecommendationsSchema, budgetIdSchema, budgetListSchema, createBudgetSchema, updateBudgetSchema } from "./budget.validation";

const router = Router();

router.use(requireAuth);
router.post("/", validateRequest(createBudgetSchema), createBudget);
router.get("/current", validateRequest(budgetListSchema), getCurrentBudget);
router.get("/recommendations", getBudgetRecommendations);
router.post("/recommendations/apply", validateRequest(applyBudgetRecommendationsSchema), applyBudgetRecommendations);
router.get("/", validateRequest(budgetListSchema), getBudgets);
router.patch("/:id", validateRequest(updateBudgetSchema), updateBudget);
router.delete("/:id", validateRequest(budgetIdSchema), deleteBudget);

export default router;
