import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { deleteScenario, getScenarioHistory, simulateScenario } from "./scenario.controller";
import { scenarioIdSchema, simulateScenarioSchema } from "./scenario.validation";

const router = Router();

router.use(requireAuth);
router.post("/simulate", validateRequest(simulateScenarioSchema), simulateScenario);
router.get("/history", getScenarioHistory);
router.delete("/:id", validateRequest(scenarioIdSchema), deleteScenario);

export default router;
