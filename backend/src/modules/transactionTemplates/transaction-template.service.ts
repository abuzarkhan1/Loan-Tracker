import { Types } from "mongoose";
import { PaymentMethod } from "../../constants/enums";
import { ApiError } from "../../utils/apiError";
import { buildPaginationMeta } from "../../utils/pagination";
import { CategoryModel } from "../categories/category.model";
import { transactionService } from "../transactions/transaction.service";
import { TransactionTemplateModel, TransactionTemplateType } from "./transaction-template.model";

const toObjectId = (id: string | Types.ObjectId) => typeof id === "string" ? new Types.ObjectId(id) : id;

const validateCategory = async (userId: string, type: TransactionTemplateType, categoryId: string) => {
  const category = await CategoryModel.findOne({ _id: toObjectId(categoryId), userId: toObjectId(userId), type, isActive: true });
  if (!category) throw new ApiError(400, `${type.toLowerCase()} category not found`);
  return category._id;
};

export const transactionTemplateService = {
  async create(userId: string, payload: {
    title: string;
    type: TransactionTemplateType;
    amount: number;
    categoryId: string;
    paymentMethod: PaymentMethod;
    note?: string;
    isFavorite: boolean;
  }) {
    const categoryId = await validateCategory(userId, payload.type, payload.categoryId);
    return TransactionTemplateModel.create({ ...payload, userId: toObjectId(userId), categoryId, note: payload.note || undefined });
  },

  async list(userId: string, filters: { type?: string; isFavorite?: boolean; search?: string; page: number; limit: number }) {
    const query: Record<string, unknown> = { userId: toObjectId(userId) };
    if (filters.type) query.type = filters.type;
    if (filters.isFavorite !== undefined) query.isFavorite = filters.isFavorite;
    if (filters.search) query.title = new RegExp(filters.search, "i");
    const limit = Math.min(filters.limit, 100);
    const [templates, total] = await Promise.all([
      TransactionTemplateModel.find(query).populate("categoryId", "name type icon color").sort({ isFavorite: -1, lastUsedAt: -1, createdAt: -1 }).skip((filters.page - 1) * limit).limit(limit),
      TransactionTemplateModel.countDocuments(query),
    ]);
    return { templates, pagination: buildPaginationMeta(filters.page, limit, total) };
  },

  async get(userId: string, id: string) {
    const template = await TransactionTemplateModel.findOne({ _id: id, userId: toObjectId(userId) }).populate("categoryId", "name type icon color");
    if (!template) throw new ApiError(404, "Transaction template not found");
    return template;
  },

  async update(userId: string, id: string, payload: Record<string, unknown>) {
    const template = await TransactionTemplateModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!template) throw new ApiError(404, "Transaction template not found");
    const categoryId = payload.categoryId ? await validateCategory(userId, (payload.type as TransactionTemplateType) || template.type, payload.categoryId as string) : template.categoryId;
    template.set({ ...payload, categoryId, note: payload.note === "" ? undefined : payload.note });
    await template.save();
    return template.populate("categoryId", "name type icon color");
  },

  async delete(userId: string, id: string) {
    const template = await TransactionTemplateModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!template) throw new ApiError(404, "Transaction template not found");
    await template.deleteOne();
    return { id };
  },

  async use(userId: string, id: string) {
    const template = await TransactionTemplateModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!template) throw new ApiError(404, "Transaction template not found");
    const transaction = await transactionService.create(userId, {
      type: template.type,
      amount: template.amount,
      categoryId: template.categoryId.toString(),
      date: new Date(),
      source: template.title,
      paymentMethod: template.paymentMethod,
      note: template.note,
    });
    template.lastUsedAt = new Date();
    await template.save();
    return { template, transaction };
  },
};
