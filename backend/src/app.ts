import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import authRoutes from "./modules/auth/auth.routes";
import contactRoutes from "./modules/contacts/contact.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import loanRoutes from "./modules/loans/loan.routes";
import paymentRoutes from "./modules/payments/payment.routes";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Loan Tracker API is healthy",
    data: {
      uptime: process.uptime(),
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
