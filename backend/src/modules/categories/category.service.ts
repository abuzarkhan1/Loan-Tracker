import { Types } from "mongoose";
import { defaultCategories } from "../../utils/defaultCategories";
import { ApiError } from "../../utils/apiError";
import { TransactionModel } from "../transactions/transaction.model";
import { CategoryModel, CategoryType } from "./category.model";

const toObjectId = (id: string) => new Types.ObjectId(id);
const normalize = (payload: Record<string, unknown>) => {
  const next = { ...payload };
  if (next.icon === "") next.icon = undefined;
  if (next.color === "") next.color = undefined;
  return next;
};

export const categoryService = {
  async ensureDefaults(userId: string) {
    await Promise.all(defaultCategories.map((category) =>
      CategoryModel.updateOne(
        { userId: toObjectId(userId), type: category.type, name: category.name },
        { $setOnInsert: { ...category, userId: toObjectId(userId), isDefault: true, isActive: true } },
        { upsert: true },
      ),
    ));
  },

  async list(userId: string, filters: { type?: CategoryType; includeInactive?: boolean }) {
    await this.ensureDefaults(userId);
    const query: Record<string, unknown> = { userId: toObjectId(userId) };
    if (filters.type) query.type = filters.type;
    if (!filters.includeInactive) query.isActive = true;
    return CategoryModel.find(query).sort({ isDefault: -1, type: 1, name: 1 });
  },

  async create(userId: string, payload: { name: string; type: CategoryType; icon?: string; color?: string; monthlyBudget?: number }) {
    await this.ensureDefaults(userId);
    return CategoryModel.create({
      ...normalize(payload),
      userId: toObjectId(userId),
      isDefault: false,
      isActive: true,
    });
  },

  async update(userId: string, id: string, payload: Record<string, unknown>) {
    const category = await CategoryModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!category) throw new ApiError(404, "Category not found");
    if (category.isDefault && (payload.name || payload.type)) {
      throw new ApiError(400, "Default category name/type cannot be changed");
    }
    category.set(normalize(payload));
    await category.save();
    return category;
  },

  async delete(userId: string, id: string) {
    const category = await CategoryModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!category) throw new ApiError(404, "Category not found");

    const transactionCount = await TransactionModel.countDocuments({ userId: toObjectId(userId), categoryId: category._id });
    if (category.isDefault || transactionCount > 0) {
      category.isActive = false;
      await category.save();
      return { id, deactivated: true };
    }

    await category.deleteOne();
    return { id, deactivated: false };
  },
};
