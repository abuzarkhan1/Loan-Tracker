import { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger";

const getIp = (req: Request) =>
  req.ip || req.socket.remoteAddress || req.header("x-forwarded-for") || "unknown";

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger.log(level, "http_request", {
      requestId: req.requestId,
      userId: req.user?.id,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs),
      ip: getIp(req),
      userAgent: req.header("user-agent"),
    });
  });

  next();
};
