import { NextFunction, Request, Response } from "express";
import { cacheService } from "./cache.service";

type CacheMiddlewareOptions = {
  ttlSeconds: number;
  keyBuilder: (req: Request) => string;
};

export const cacheMiddleware =
  ({ ttlSeconds, keyBuilder }: CacheMiddlewareOptions) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const key = keyBuilder(req);
    const cached = await cacheService.get(key);

    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        void cacheService.set(key, body, ttlSeconds);
      }
      res.setHeader("X-Cache", "MISS");
      return originalJson(body);
    };

    return next();
  };
