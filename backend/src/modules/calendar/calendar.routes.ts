import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { getCalendarDay, getCalendarEvents, getCalendarMonthSummary } from "./calendar.controller";
import { calendarDaySchema, calendarMonthSchema, calendarRangeSchema } from "./calendar.validation";

const router = Router();

router.use(requireAuth);
router.get("/events", validateRequest(calendarRangeSchema), getCalendarEvents);
router.get("/day", validateRequest(calendarDaySchema), getCalendarDay);
router.get("/month-summary", validateRequest(calendarMonthSchema), getCalendarMonthSummary);

export default router;
