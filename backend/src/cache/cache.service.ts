import { cacheRedis, isRedisReady } from "../config/redis";
import { logger } from "../config/logger";

const safeJsonParse = <T>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    logger.warn("cache_parse_failed", { error });
    return null;
  }
};

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!isRedisReady(cacheRedis)) return null;
      const value = await cacheRedis.get(key);
      if (!value) return null;
      return safeJsonParse<T>(value);
    } catch (error) {
      logger.warn("cache_get_failed", { key, error });
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds: number) {
    try {
      if (!isRedisReady(cacheRedis)) return false;
      await cacheRedis.set(key, JSON.stringify(value), "EX", ttlSeconds);
      return true;
    } catch (error) {
      logger.warn("cache_set_failed", { key, error });
      return false;
    }
  },

  async del(key: string) {
    try {
      if (!isRedisReady(cacheRedis)) return 0;
      return cacheRedis.del(key);
    } catch (error) {
      logger.warn("cache_del_failed", { key, error });
      return 0;
    }
  },

  async delByPattern(pattern: string) {
    try {
      if (!isRedisReady(cacheRedis)) return 0;
      let cursor = "0";
      let deleted = 0;

      do {
        const [nextCursor, keys] = await cacheRedis.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = nextCursor;
        if (keys.length) {
          deleted += await cacheRedis.del(...keys);
        }
      } while (cursor !== "0");

      return deleted;
    } catch (error) {
      logger.warn("cache_del_pattern_failed", { pattern, error });
      return 0;
    }
  },
};
