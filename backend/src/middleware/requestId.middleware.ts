import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const incomingRequestId = req.header("x-request-id");
  req.requestId = incomingRequestId && incomingRequestId.trim().length ? incomingRequestId : randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
};
