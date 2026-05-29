import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createSalaryAllocation,
  createSalaryEntry,
  deleteSalaryAllocation,
  deleteSalaryEntry,
  getCurrentSalaryCycle,
  getCurrentCycleSalaryEntry,
  getSalaryAllocationSummary,
  getSalaryAllocations,
  getSalaryCycleSummary,
  getSalaryDashboard,
  getSalaryEntries,
  getSalaryEntry,
  getSalaryProfile,
  markSalaryMissed,
  markSalaryReceived,
  updateSalaryAllocation,
  updateSalaryEntry,
  upsertSalaryProfile,
} from "./salary.controller";
import {
  createSalaryAllocationSchema,
  createSalaryEntrySchema,
  markSalaryReceivedSchema,
  patchSalaryProfileSchema,
  salaryAllocationIdSchema,
  salaryAllocationListSchema,
  salaryCycleQuerySchema,
  salaryEntryIdSchema,
  salaryEntryListSchema,
  updateSalaryAllocationSchema,
  updateSalaryEntrySchema,
  upsertSalaryProfileSchema,
} from "./salary.validation";

const router = Router();

router.use(requireAuth);
router.get("/profile", getSalaryProfile);
router.post("/profile", validateRequest(upsertSalaryProfileSchema), upsertSalaryProfile);
router.patch("/profile", validateRequest(patchSalaryProfileSchema), upsertSalaryProfile);
router.get("/dashboard", getSalaryDashboard);
router.get("/current-cycle", validateRequest(salaryCycleQuerySchema), getCurrentSalaryCycle);
router.get("/cycle-summary", validateRequest(salaryCycleQuerySchema), getSalaryCycleSummary);
router.post("/entries", validateRequest(createSalaryEntrySchema), createSalaryEntry);
router.get("/entries", validateRequest(salaryEntryListSchema), getSalaryEntries);
router.get("/entries/current-cycle", getCurrentCycleSalaryEntry);
router.get("/entries/:id", validateRequest(salaryEntryIdSchema), getSalaryEntry);
router.patch("/entries/:id", validateRequest(updateSalaryEntrySchema), updateSalaryEntry);
router.delete("/entries/:id", validateRequest(salaryEntryIdSchema), deleteSalaryEntry);
router.patch("/entries/:id/mark-received", validateRequest(markSalaryReceivedSchema), markSalaryReceived);
router.patch("/entries/:id/mark-missed", validateRequest(salaryEntryIdSchema), markSalaryMissed);
router.post("/allocations", validateRequest(createSalaryAllocationSchema), createSalaryAllocation);
router.get("/allocations", validateRequest(salaryAllocationListSchema), getSalaryAllocations);
router.get("/allocation-summary", validateRequest(salaryCycleQuerySchema), getSalaryAllocationSummary);
router.patch("/allocations/:id", validateRequest(updateSalaryAllocationSchema), updateSalaryAllocation);
router.delete("/allocations/:id", validateRequest(salaryAllocationIdSchema), deleteSalaryAllocation);

export default router;
