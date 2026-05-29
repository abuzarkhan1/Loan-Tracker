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
import alertRoutes from "./modules/alerts/alert.routes";
import affordabilityRoutes from "./modules/affordability/affordability.routes";
import assistantRoutes from "./modules/assistant/assistant.routes";
import billRoutes from "./modules/bills/bill.routes";
import billOccurrenceRoutes from "./modules/bills/bill-occurrence.routes";
import budgetRoutes from "./modules/budgets/budget.routes";
import calendarRoutes from "./modules/calendar/calendar.routes";
import categorizationRoutes from "./modules/categorization/categorization.routes";
import categoryRoutes from "./modules/categories/category.routes";
import communicationRoutes from "./modules/communications/communication.routes";
import contactRoutes from "./modules/contacts/contact.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import dataQualityRoutes from "./modules/dataQuality/data-quality.routes";
import emailRoutes from "./modules/email/email.routes";
import followUpRoutes from "./modules/followUps/follow-up.routes";
import financeRoutes from "./modules/finance/finance.routes";
import forecastRoutes from "./modules/forecast/forecast.routes";
import goalPlannerRoutes from "./modules/goalPlanner/goal-planner.routes";
import healthRoutes from "./modules/health/health.routes";
import moneyHealthRoutes from "./modules/moneyHealth/money-health.routes";
import installmentRoutes from "./modules/installments/installment.routes";
import loanRoutes from "./modules/loans/loan.routes";
import paymentRoutes from "./modules/payments/payment.routes";
import paymentRequestRoutes from "./modules/paymentRequests/payment-request.routes";
import publicPaymentRequestRoutes from "./modules/paymentRequests/public-payment-request.routes";
import promiseRoutes from "./modules/promises/promise.routes";
import receiptRoutes from "./modules/receipts/receipt.routes";
import recoveryRoutes from "./modules/recovery/recovery.routes";
import recurringTransactionRoutes from "./modules/recurringTransactions/recurring-transaction.routes";
import recurringOccurrenceRoutes from "./modules/recurringTransactions/recurring-occurrence.routes";
import reminderRoutes from "./modules/reminders/reminder.routes";
import reminderTemplateRoutes from "./modules/reminderTemplates/reminder-template.routes";
import reportRoutes from "./modules/reports/report.routes";
import reviewRoutes from "./modules/reviews/review.routes";
import scenarioRoutes from "./modules/scenarios/scenario.routes";
import settlementRoutes from "./modules/settlements/settlement.routes";
import salaryRoutes from "./modules/salary/salary.routes";
import savingsGoalRoutes from "./modules/savingsGoals/savings-goal.routes";
import privacySettingsRoutes from "./modules/settings/privacy-settings.routes";
import smartEntryRoutes from "./modules/smartEntry/smart-entry.routes";
import transactionRoutes from "./modules/transactions/transaction.routes";
import spendingInsightRoutes from "./modules/spendingInsights/spending-insight.routes";
import transactionTemplateRoutes from "./modules/transactionTemplates/transaction-template.routes";
import whatChangedRoutes from "./modules/whatChanged/what-changed.routes";

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
app.use("/api/alerts", alertRoutes);
app.use("/api/affordability", affordabilityRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/bill-occurrences", billOccurrenceRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/recovery", recoveryRoutes);
app.use("/api/follow-ups", followUpRoutes);
app.use("/api/promises", promiseRoutes);
app.use("/api/payment-requests", paymentRequestRoutes);
app.use("/api/settlements", settlementRoutes);
app.use("/api/communications", communicationRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/categorization", categorizationRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/transaction-templates", transactionTemplateRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/savings-goals", savingsGoalRoutes);
app.use("/api/goals", goalPlannerRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/health-score", moneyHealthRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/forecast", forecastRoutes);
app.use("/api/recurring-transactions", recurringTransactionRoutes);
app.use("/api/recurring-occurrences", recurringOccurrenceRoutes);
app.use("/api/insights/what-changed", whatChangedRoutes);
app.use("/api/insights", spendingInsightRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/scenarios", scenarioRoutes);
app.use("/api/data-quality", dataQualityRoutes);
app.use("/api/settings", privacySettingsRoutes);
app.use("/api/smart-entry", smartEntryRoutes);
app.use("/api/public", publicPaymentRequestRoutes);
app.use("/api/health", healthRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
