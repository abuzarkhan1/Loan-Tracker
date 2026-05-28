import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";

  if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = "Invalid resource id";
  }

  if (error?.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyPattern || {})[0] || "field";
    message = `${field} already exists`;
  }

  if (env.NODE_ENV === "development") {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
};
