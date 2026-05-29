import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { requestIdMiddleware } from "./middleware/requestId.middleware";
import { requestLoggerMiddleware } from "./middleware/requestLogger.middleware";
import auditLogRoutes from "./modules/audit/audit-log.routes";
import authRoutes from "./modules/auth/auth.routes";
import contactRoutes from "./modules/contacts/contact.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import healthRoutes from "./modules/health/health.routes";
import installmentRoutes from "./modules/installments/installment.routes";
import loanRoutes from "./modules/loans/loan.routes";
import paymentRoutes from "./modules/payments/payment.routes";
import reminderRoutes from "./modules/reminders/reminder.routes";
import reportRoutes from "./modules/reports/report.routes";

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
app.use("/api/contacts", contactRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/installments", installmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/health", healthRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
