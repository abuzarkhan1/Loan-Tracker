import mongoose from "mongoose";
import { cacheRedis, pingRedis, queueRedisConnection } from "../../config/redis";
import { env } from "../../config/env";
import { getQueueHealth } from "../../queues";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

const dbStateMap: Record<number, string> = {
  0: "disconnected",
  1: "healthy",
  2: "connecting",
  3: "disconnecting",
};

const getAppHealth = () => ({
  status: "healthy",
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
  environment: env.NODE_ENV,
});

const getDbHealth = () => {
  const readyState = mongoose.connection.readyState;
  return {
    status: dbStateMap[readyState] || "unknown",
    readyState,
    database: mongoose.connection.name,
  };
};

export const getHealth = asyncHandler(async (_req, res) => {
  const [cache, queue] = await Promise.all([
    pingRedis(cacheRedis),
    pingRedis(queueRedisConnection),
  ]);

  const data = {
    app: getAppHealth(),
    database: getDbHealth(),
    redis: {
      cache,
      queue,
    },
  };

  const status =
    data.database.status === "healthy" &&
    (cache.status === "healthy" || cache.status === "disabled" || cache.status === "unavailable")
      ? "Loan Tracker API is healthy"
      : "Loan Tracker API is degraded";

  return sendResponse(res, 200, status, data);
});

export const getRedisHealth = asyncHandler(async (_req, res) => {
  const [cache, queue] = await Promise.all([
    pingRedis(cacheRedis),
    pingRedis(queueRedisConnection),
  ]);

  return sendResponse(res, 200, "Redis health fetched successfully", {
    cache,
    queue,
    timestamp: new Date().toISOString(),
  });
});

export const getDbHealthStatus = asyncHandler(async (_req, res) => {
  return sendResponse(res, 200, "Database health fetched successfully", {
    ...getDbHealth(),
    timestamp: new Date().toISOString(),
  });
});

export const getQueuesHealth = asyncHandler(async (_req, res) => {
  const queues = await getQueueHealth();
  return sendResponse(res, 200, "Queue health fetched successfully", {
    queues,
    timestamp: new Date().toISOString(),
  });
});
