import { Request } from "express";

export const getAuditRequestMeta = (req: Request) => ({
  ip: req.ip,
  userAgent: req.get("user-agent"),
  metadata: {
    requestId: req.requestId,
  },
});

export const serializeAuditValue = <T>(value: T) => {
  if (!value) return value;
  if (typeof value === "object" && "toObject" in value && typeof value.toObject === "function") {
    return value.toObject();
  }
  return value;
};
