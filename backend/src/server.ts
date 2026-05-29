import mongoose from "mongoose";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { app } from "./app";
import { logger } from "./config/logger";
import { connectRedis, closeRedis } from "./config/redis";
import { localStorageService } from "./storage/local-storage.service";
import { closeQueues } from "./queues";
import { closeWorkers, startWorkers } from "./workers";

const startServer = async () => {
  try {
    await connectDB();
    await localStorageService.ensureDirectories();
    await connectRedis();
    startWorkers();

    const server = app.listen(env.PORT, () => {
      logger.info("server_started", { port: env.PORT, environment: env.NODE_ENV });
    });

    const shutdown = async (signal: string) => {
      logger.info("server_shutdown_started", { signal });
      server.close(async () => {
        await Promise.allSettled([
          closeWorkers(),
          closeQueues(),
          closeRedis(),
          mongoose.disconnect(),
        ]);
        logger.info("server_stopped");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    process.on("SIGINT", () => void shutdown("SIGINT"));
  } catch (error) {
    logger.error("server_start_failed", { error });
    process.exit(1);
  }
};

void startServer();
