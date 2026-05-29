import { Types } from "mongoose";
import { PaymentMethod } from "../../constants/enums";
import { suggestDefaultCategory } from "../../utils/categorySuggestion";
import { ApiError } from "../../utils/apiError";
import { CategoryModel } from "../categories/category.model";
import { categoryService } from "../categories/category.service";
import { auditLogService } from "../audit/audit-log.service";
import { CategoryRuleModel } from "./category-rule.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

export const categorizationService = {
  async suggest(userId: string, payload: { text?: string; amount?: number; type: "INCOME" | "EXPENSE" }) {
    await categoryService.ensureDefaults(userId);
    const lower = (payload.text || "").toLowerCase();
    const userRule = lower
      ? await CategoryRuleModel.findOne({
          userId: toObjectId(userId),
          type: payload.type,
          keyword: { $in: lower.split(/\s+/).filter(Boolean) },
        }).populate("categoryId", "name type icon color")
      : null;
    if (userRule) {
      const category = userRule.categoryId as any;
      return {
        suggestedCategoryId: category._id.toString(),
        suggestedCategoryName: category.name,
        suggestedPaymentMethod: userRule.paymentMethod || PaymentMethod.CASH,
        confidence: userRule.confidence,
        reason: `Learned from your correction for "${userRule.keyword}"`,
      };
    }

    const fallback = suggestDefaultCategory(payload);
    const category = await CategoryModel.findOne({
      userId: toObjectId(userId),
      type: payload.type,
      name: fallback.categoryName,
      isActive: true,
    });
    return {
      suggestedCategoryId: category?._id.toString(),
      suggestedCategoryName: category?.name || fallback.categoryName,
      suggestedPaymentMethod: fallback.paymentMethod,
      confidence: fallback.confidence,
      reason: fallback.reason,
    };
  },

  async feedback(userId: string, payload: { text: string; type: "INCOME" | "EXPENSE"; categoryId: string; paymentMethod?: PaymentMethod }) {
    const category = await CategoryModel.findOne({ _id: toObjectId(payload.categoryId), userId: toObjectId(userId), type: payload.type });
    if (!category) throw new ApiError(404, "Category not found");
    const keyword = payload.text.toLowerCase().split(/\s+/).find((word) => word.length >= 3) || payload.text.toLowerCase().slice(0, 40);
    const rule = await CategoryRuleModel.findOneAndUpdate(
      { userId: toObjectId(userId), type: payload.type, keyword },
      {
        $set: {
          categoryId: category._id,
          paymentMethod: payload.paymentMethod,
          confidence: 0.9,
          createdFromUserFeedback: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await auditLogService.record({
      userId,
      action: "CATEGORIZATION_FEEDBACK_SAVED",
      entityType: "CATEGORY_RULE",
      entityId: rule._id.toString(),
      newValue: rule.toObject(),
    });
    return rule;
  },
};
