import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { getMoneyHealthScore } from "./money-health.controller";

const router = Router();

router.use(requireAuth);
router.get("/money", getMoneyHealthScore);

export default router;
