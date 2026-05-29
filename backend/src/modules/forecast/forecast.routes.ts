import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { getCurrentCycleForecast, getCustomForecast, getMonthEndForecast } from "./forecast.controller";
import { forecastRangeSchema } from "./forecast.validation";

const router = Router();

router.use(requireAuth);
router.get("/current-cycle", getCurrentCycleForecast);
router.get("/month-end", getMonthEndForecast);
router.get("/custom", validateRequest(forecastRangeSchema), getCustomForecast);

export default router;
