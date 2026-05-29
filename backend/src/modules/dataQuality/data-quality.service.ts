import { detectDataQualityIssues } from "../../utils/dataQualityDetector";
import { Types } from "mongoose";
import { auditLogService } from "../audit/audit-log.service";
import { DataQualityResolutionModel } from "./data-quality-resolution.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

export const dataQualityService = {
  async issues(userId: string) {
    const [issues, resolutions] = await Promise.all([
      detectDataQualityIssues(userId),
      DataQualityResolutionModel.find({ userId: toObjectId(userId) }).select("issueId").lean(),
    ]);
    const resolvedIds = new Set(resolutions.map((item) => item.issueId));
    const unresolved = issues.filter((issue) => !resolvedIds.has(issue.id));
    const resolvedCount = issues.length - unresolved.length;
    return {
      totalIssues: unresolved.length,
      resolvedCount,
      score: Math.max(0, 100 - unresolved.length * 4),
      issues: unresolved,
    };
  },

  async resolve(userId: string, id: string) {
    const resolution = await DataQualityResolutionModel.findOneAndUpdate(
      { userId: toObjectId(userId), issueId: id },
      { $set: { status: "RESOLVED", resolvedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await auditLogService.record({
      userId,
      action: "DATA_QUALITY_ISSUE_RESOLVED",
      entityType: "DATA_QUALITY_ISSUE",
      metadata: { issueId: id },
      newValue: resolution.toObject(),
    });
    return { id, status: "RESOLVED", message: "Issue dismissed. It will stay hidden unless a new issue is detected." };
  },
};
