import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { requestIdMiddleware } from "./middleware/requestId.middleware";
import { requestLoggerMiddleware } from "./middleware/requestLogger.middleware";
import auditLogRoutes from "./modules/audit/audit-log.routes";
import activityRoutes from "./modules/activity/activity.routes";
import authRoutes from "./modules/auth/auth.routes";
import backupRoutes from "./modules/backups/backup.routes";
import budgetRoutes from "./modules/budgets/budget.routes";
import categoryRoutes from "./modules/categories/category.routes";
import communicationRoutes from "./modules/communications/communication.routes";
import contactRoutes from "./modules/contacts/contact.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import emailRoutes from "./modules/email/email.routes";
import followUpRoutes from "./modules/followUps/follow-up.routes";
import financeRoutes from "./modules/finance/finance.routes";
import healthRoutes from "./modules/health/health.routes";
import installmentRoutes from "./modules/installments/installment.routes";
import loanRoutes from "./modules/loans/loan.routes";
import paymentRoutes from "./modules/payments/payment.routes";
import paymentRequestRoutes from "./modules/paymentRequests/payment-request.routes";
import publicPaymentRequestRoutes from "./modules/paymentRequests/public-payment-request.routes";
import promiseRoutes from "./modules/promises/promise.routes";
import receiptRoutes from "./modules/receipts/receipt.routes";
import recoveryRoutes from "./modules/recovery/recovery.routes";
import reminderRoutes from "./modules/reminders/reminder.routes";
import reminderTemplateRoutes from "./modules/reminderTemplates/reminder-template.routes";
import reportRoutes from "./modules/reports/report.routes";
import settlementRoutes from "./modules/settlements/settlement.routes";
import salaryRoutes from "./modules/salary/salary.routes";
import savingsGoalRoutes from "./modules/savingsGoals/savings-goal.routes";
import transactionRoutes from "./modules/transactions/transaction.routes";

export const app = express();

app.use(helmet());
app.use(requestIdMiddleware);
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(`/${env.UPLOAD_DIR}`, express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));
if (env.NODE_ENV !== "test") {
  app.use(requestLoggerMiddleware);
}

app.use("/health", healthRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/installments", installmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/reminder-templates", reminderTemplateRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/backups", backupRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/recovery", recoveryRoutes);
app.use("/api/follow-ups", followUpRoutes);
app.use("/api/promises", promiseRoutes);
app.use("/api/payment-requests", paymentRequestRoutes);
app.use("/api/settlements", settlementRoutes);
app.use("/api/communications", communicationRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/savings-goals", savingsGoalRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/public", publicPaymentRequestRoutes);
app.use("/api/health", healthRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
