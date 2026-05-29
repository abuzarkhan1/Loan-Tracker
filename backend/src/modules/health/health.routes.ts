import { Router } from "express";
import { getDbHealthStatus, getHealth, getQueuesHealth, getRedisHealth } from "./health.controller";

const router = Router();

router.get("/", getHealth);
router.get("/redis", getRedisHealth);
router.get("/db", getDbHealthStatus);
router.get("/queues", getQueuesHealth);

export default router;
