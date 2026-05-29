import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { createBudget, deleteBudget, getBudgets, getCurrentBudget, updateBudget } from "./budget.controller";
import { budgetIdSchema, budgetListSchema, createBudgetSchema, updateBudgetSchema } from "./budget.validation";

const router = Router();

router.use(requireAuth);
router.post("/", validateRequest(createBudgetSchema), createBudget);
router.get("/current", validateRequest(budgetListSchema), getCurrentBudget);
router.get("/", validateRequest(budgetListSchema), getBudgets);
router.patch("/:id", validateRequest(updateBudgetSchema), updateBudget);
router.delete("/:id", validateRequest(budgetIdSchema), deleteBudget);

export default router;
