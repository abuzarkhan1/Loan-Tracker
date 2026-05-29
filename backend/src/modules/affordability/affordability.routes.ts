import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { checkAffordability } from "./affordability.controller";
import { affordabilityCheckSchema } from "./affordability.validation";

const router = Router();

router.use(requireAuth);
router.post("/check", validateRequest(affordabilityCheckSchema), checkAffordability);

export default router;
