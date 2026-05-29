import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { getRecoveryCenter } from "./recovery.controller";

const router = Router();

router.use(requireAuth);
router.get("/center", getRecoveryCenter);

export default router;
