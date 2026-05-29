import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { getCategoryTrend, getSpendingHabits } from "./spending-insight.controller";
import { categoryTrendSchema, spendingHabitsSchema } from "./spending-insight.validation";

const router = Router();

router.use(requireAuth);
router.get("/spending-habits", validateRequest(spendingHabitsSchema), getSpendingHabits);
router.get("/spending-habits/category/:categoryId", validateRequest(categoryTrendSchema), getCategoryTrend);

export default router;
