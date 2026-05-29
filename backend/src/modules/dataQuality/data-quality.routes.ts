import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { getDataQualityIssues, resolveDataQualityIssue } from "./data-quality.controller";
import { dataQualityIssueIdSchema } from "./data-quality.validation";

const router = Router();

router.use(requireAuth);
router.get("/issues", getDataQualityIssues);
router.patch("/issues/:id/resolve", validateRequest(dataQualityIssueIdSchema), resolveDataQualityIssue);

export default router;
