import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  getTransactions,
  updateTransaction,
} from "./transaction.controller";
import {
  createTransactionSchema,
  transactionIdSchema,
  transactionListSchema,
  updateTransactionSchema,
} from "./transaction.validation";

const router = Router();

router.use(requireAuth);
router.post("/", validateRequest(createTransactionSchema), createTransaction);
router.get("/", validateRequest(transactionListSchema), getTransactions);
router.get("/:id", validateRequest(transactionIdSchema), getTransaction);
router.patch("/:id", validateRequest(updateTransactionSchema), updateTransaction);
router.delete("/:id", validateRequest(transactionIdSchema), deleteTransaction);

export default router;
