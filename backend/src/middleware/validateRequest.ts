import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../utils/apiError";

export const validateRequest =
  (schema: z.ZodTypeAny) => (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(", ");
      return next(new ApiError(400, message || "Invalid request payload"));
    }

    const data = parsed.data as {
      body?: unknown;
      query?: Request["query"];
      params?: Request["params"];
    };

    if (data.body !== undefined) {
      req.body = data.body;
    }

    if (data.query !== undefined) {
      Object.defineProperty(req, "query", {
        value: data.query,
        configurable: true,
        writable: true,
      });
    }

    if (data.params !== undefined) {
      req.params = data.params;
    }

    return next();
  };
