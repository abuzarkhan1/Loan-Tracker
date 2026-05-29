import { Types } from "mongoose";
import { ApiError } from "../../utils/apiError";
import { buildPaginationMeta } from "../../utils/pagination";
import { createSettlementNumber } from "../../utils/settlementNumber";
import { LoanStatus } from "../../constants/enums";
import { LoanModel } from "../loans/loan.model";
import { receiptService } from "../receipts/receipt.service";
import { SettlementModel } from "./settlement.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

export const settlementService = {
  async createForLoan(userId: string, loanId: string, payload: { settlementNote?: string }) {
    const loan = await LoanModel.findOne({ _id: loanId, userId });
    if (!loan) throw new ApiError(404, "Loan not found");
    if (loan.remainingAmount > 0 || loan.status !== LoanStatus.COMPLETED) {
      throw new ApiError(400, "Please add final payment before settlement");
    }
    const existing = await SettlementModel.findOne({ userId, loanId, status: "SETTLED" });
    if (existing) return existing;
    const receipt = await receiptService.createLoanReceipt(userId, loanId);
    return SettlementModel.create({
      userId: toObjectId(userId),
      contactId: loan.contactId,
      loanId: toObjectId(loanId),
      settlementNumber: createSettlementNumber(),
      finalAmount: loan.totalPayableAmount || loan.amount,
      paidAmount: loan.paidAmount,
      remainingAmountAtSettlement: loan.remainingAmount,
      settlementNote: payload.settlementNote || undefined,
      receiptId: receipt?._id,
      status: "SETTLED",
      settledAt: new Date(),
    });
  },

  async list(userId: string, filters: { status?: string; page: number; limit: number }) {
    const query: Record<string, unknown> = { userId: toObjectId(userId) };
    if (filters.status) query.status = filters.status;
    const limit = Math.min(filters.limit, 100);
    const [settlements, total] = await Promise.all([
      SettlementModel.find(query).populate("contactId", "name phone").populate("loanId", "amount status").sort({ createdAt: -1 }).skip((filters.page - 1) * limit).limit(limit),
      SettlementModel.countDocuments(query),
    ]);
    return { settlements, pagination: buildPaginationMeta(filters.page, limit, total) };
  },

  async get(userId: string, id: string) {
    const settlement = await SettlementModel.findOne({ _id: id, userId }).populate("contactId", "name phone").populate("loanId", "amount paidAmount remainingAmount status").populate("receiptId");
    if (!settlement) throw new ApiError(404, "Settlement not found");
    return settlement;
  },

  async getByLoan(userId: string, loanId: string) {
    return SettlementModel.findOne({ userId, loanId }).populate("receiptId").sort({ createdAt: -1 });
  },

  async cancel(userId: string, id: string) {
    const settlement = await SettlementModel.findOneAndUpdate({ _id: id, userId }, { $set: { status: "CANCELLED" } }, { new: true });
    if (!settlement) throw new ApiError(404, "Settlement not found");
    return settlement;
  },
};
