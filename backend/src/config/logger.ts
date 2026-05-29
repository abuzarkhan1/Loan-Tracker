import winston from "winston";
import { env } from "./env";

const errorFormat = winston.format((info) => {
  if (info instanceof Error) {
    return {
      ...info,
      message: info.message,
      stack: info.stack,
    };
  }

  if (info.error instanceof Error) {
    return {
      ...info,
      error: {
        message: info.error.message,
        stack: env.NODE_ENV === "development" ? info.error.stack : undefined,
        name: info.error.name,
      },
    };
  }

  return info;
});

const developmentFormat = winston.format.combine(
  winston.format.timestamp(),
  errorFormat(),
  winston.format.colorize(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaText = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${message}${metaText}`;
  }),
);

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  errorFormat(),
  winston.format.json(),
);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: {
    service: "loan-tracker-api",
    environment: env.NODE_ENV,
  },
  format: env.NODE_ENV === "production" ? productionFormat : developmentFormat,
  transports: [new winston.transports.Console()],
});
