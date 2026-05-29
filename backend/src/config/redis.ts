import IORedis, { Redis, RedisOptions } from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

type RedisRole = "cache" | "queue";

const buildRedisOptions = (role: RedisRole): RedisOptions => {
  const db = role === "cache" ? env.REDIS_CACHE_DB : env.REDIS_QUEUE_DB;
  const common: RedisOptions = {
    db,
    lazyConnect: true,
    password: env.REDIS_PASSWORD,
    enableReadyCheck: true,
    retryStrategy(times) {
      return Math.min(times * 200, 5_000);
    },
    reconnectOnError(error) {
      logger.warn("redis_reconnect_on_error", {
        role,
        message: error.message,
      });
      return true;
    },
  };

  if (env.REDIS_URL) {
    const url = new URL(env.REDIS_URL);
    return {
      ...common,
      host: url.hostname,
      port: Number(url.port || 6379),
      username: url.username ? decodeURIComponent(url.username) : undefined,
      password: env.REDIS_PASSWORD || (url.password ? decodeURIComponent(url.password) : undefined),
      db,
    };
  }

  return {
    ...common,
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  };
};

const createRedisClient = (role: RedisRole, options: RedisOptions) => {
  const client = new IORedis(options);

  client.on("connect", () => logger.info("redis_connect", { role }));
  client.on("ready", () => logger.info("redis_ready", { role }));
  client.on("reconnecting", () => logger.warn("redis_reconnecting", { role }));
  client.on("end", () => logger.warn("redis_connection_ended", { role }));
  client.on("error", (error) => logger.warn("redis_error", { role, message: error.message }));

  return client;
};

export const cacheRedisOptions = {
  ...buildRedisOptions("cache"),
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
} satisfies RedisOptions;

export const queueRedisOptions = {
  ...buildRedisOptions("queue"),
  maxRetriesPerRequest: null,
} satisfies RedisOptions;

export const cacheRedis = createRedisClient("cache", cacheRedisOptions);

export const queueRedisConnection = createRedisClient("queue", queueRedisOptions);

export const connectRedis = async () => {
  if (!env.REDIS_ENABLED) {
    logger.warn("redis_disabled");
    return;
  }

  await Promise.allSettled([
    cacheRedis.connect(),
    queueRedisConnection.connect(),
  ]).then((results) => {
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        logger.warn("redis_initial_connect_failed", {
          role: index === 0 ? "cache" : "queue",
          message: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    });
  });
};

export const isRedisReady = (client: Redis) => client.status === "ready";

export const pingRedis = async (client: Redis) => {
  if (!env.REDIS_ENABLED) return { status: "disabled" as const };
  if (!isRedisReady(client)) return { status: "unavailable" as const };

  const startedAt = Date.now();
  const pong = await client.ping();
  return {
    status: pong === "PONG" ? ("healthy" as const) : ("unhealthy" as const),
    latencyMs: Date.now() - startedAt,
  };
};

export const closeRedis = async () => {
  await Promise.allSettled([
    cacheRedis.quit(),
    queueRedisConnection.quit(),
  ]);
};
