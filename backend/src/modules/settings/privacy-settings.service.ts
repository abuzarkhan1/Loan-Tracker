import { Types } from "mongoose";
import { PrivacySettingsModel } from "./privacy-settings.model";
import { auditLogService } from "../audit/audit-log.service";

const toObjectId = (id: string) => new Types.ObjectId(id);

export const privacySettingsService = {
  get(userId: string) {
    return PrivacySettingsModel.findOneAndUpdate(
      { userId: toObjectId(userId) },
      { $setOnInsert: { userId: toObjectId(userId) } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  },

  async update(userId: string, payload: Record<string, unknown>) {
    const settings = await PrivacySettingsModel.findOneAndUpdate(
      { userId: toObjectId(userId) },
      { $set: payload, $setOnInsert: { userId: toObjectId(userId) } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await auditLogService.record({
      userId,
      action: "PRIVACY_SETTINGS_UPDATED",
      entityType: "PRIVACY_SETTINGS",
      entityId: settings._id.toString(),
      newValue: settings.toObject(),
    });
    return settings;
  },
};
