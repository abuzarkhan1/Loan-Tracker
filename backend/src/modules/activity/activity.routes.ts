import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { getRecentActivity } from "./activity.controller";
import { recentActivitySchema } from "./activity.validation";

const router = Router();

router.use(requireAuth);
router.get("/recent", validateRequest(recentActivitySchema), getRecentActivity);

export default router;
