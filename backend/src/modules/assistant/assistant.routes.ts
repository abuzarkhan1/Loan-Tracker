import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { askAssistant } from "./assistant.controller";
import { assistantAskSchema } from "./assistant.validation";

const router = Router();

router.use(requireAuth);
router.post("/ask", validateRequest(assistantAskSchema), askAssistant);

export default router;
