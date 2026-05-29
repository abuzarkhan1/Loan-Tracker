import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createTransactionTemplate,
  deleteTransactionTemplate,
  getTransactionTemplate,
  getTransactionTemplates,
  updateTransactionTemplate,
  useTransactionTemplate,
} from "./transaction-template.controller";
import {
  createTransactionTemplateSchema,
  transactionTemplateIdSchema,
  transactionTemplateListSchema,
  updateTransactionTemplateSchema,
} from "./transaction-template.validation";

const router = Router();

router.use(requireAuth);
router.get("/", validateRequest(transactionTemplateListSchema), getTransactionTemplates);
router.post("/", validateRequest(createTransactionTemplateSchema), createTransactionTemplate);
router.get("/:id", validateRequest(transactionTemplateIdSchema), getTransactionTemplate);
router.patch("/:id", validateRequest(updateTransactionTemplateSchema), updateTransactionTemplate);
router.delete("/:id", validateRequest(transactionTemplateIdSchema), deleteTransactionTemplate);
router.post("/:id/use", validateRequest(transactionTemplateIdSchema), useTransactionTemplate);

export default router;
