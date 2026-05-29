import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { saveCategorizationFeedback, suggestCategorization } from "./categorization.controller";
import { categorizationFeedbackSchema, suggestCategorizationSchema } from "./categorization.validation";

const router = Router();

router.use(requireAuth);
router.post("/suggest", validateRequest(suggestCategorizationSchema), suggestCategorization);
router.post("/feedback", validateRequest(categorizationFeedbackSchema), saveCategorizationFeedback);

export default router;
