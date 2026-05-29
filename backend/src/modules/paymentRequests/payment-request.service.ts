import { Types } from "mongoose";
import { env } from "../../config/env";
import { ApiError } from "../../utils/apiError";
import { buildPaginationMeta } from "../../utils/pagination";
import { createPaymentRequestNumber } from "../../utils/paymentRequestNumber";
import { createPublicToken } from "../../utils/publicToken";
import { LoanModel } from "../loans/loan.model";
import { PaymentRequestModel } from "./payment-request.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

const publicBase = () => (env.PUBLIC_WEBSITE_URL || env.PUBLIC_BASE_URL || "").replace(/\/$/, "");

export const paymentRequestService = {
  async createForLoan(userId: string, loanId: string, payload: { amountRequested?: number; message?: string; expiresAt?: Date }) {
    const loan = await LoanModel.findOne({ _id: loanId, userId }).populate("contactId", "name");
    if (!loan) throw new ApiError(404, "Loan not found");
    const amountRequested = payload.amountRequested || loan.remainingAmount;
    if (amountRequested > loan.remainingAmount) throw new ApiError(400, "Requested amount cannot exceed remaining amount");
    const contactName = loan.contactId && typeof loan.contactId === "object" && "name" in loan.contactId ? String((loan.contactId as { name?: string }).name || "Contact") : "Contact";
    const publicToken = createPublicToken();
    const publicUrl = `${publicBase() || ""}/payment-request/${publicToken}`;
    return PaymentRequestModel.create({
      userId: toObjectId(userId),
      contactId: loan.contactId,
      loanId: toObjectId(loanId),
      requestNumber: createPaymentRequestNumber(),
      amountRequested,
      remainingAmount: loan.remainingAmount,
      dueDate: loan.dueDate,
      message: payload.message || `${contactName}, Rs ${amountRequested.toLocaleString("en-PK")} payment request hai. Remaining Rs ${loan.remainingAmount.toLocaleString("en-PK")}.`,
      publicToken,
      publicUrl,
      expiresAt: payload.expiresAt,
    });
  },

  async list(userId: string, filters: { status?: string; page: number; limit: number }) {
    const query: Record<string, unknown> = { userId: toObjectId(userId) };
    if (filters.status) query.status = filters.status;
    const limit = Math.min(filters.limit, 100);
    const [paymentRequests, total] = await Promise.all([
      PaymentRequestModel.find(query).populate("contactId", "name phone").populate("loanId", "amount remainingAmount status").sort({ createdAt: -1 }).skip((filters.page - 1) * limit).limit(limit),
      PaymentRequestModel.countDocuments(query),
    ]);
    return { paymentRequests, pagination: buildPaginationMeta(filters.page, limit, total) };
  },

  async get(userId: string, id: string) {
    const request = await PaymentRequestModel.findOne({ _id: id, userId }).populate("contactId", "name phone").populate("loanId", "amount remainingAmount status dueDate");
    if (!request) throw new ApiError(404, "Payment request not found");
    return request;
  },

  async cancel(userId: string, id: string) {
    const request = await PaymentRequestModel.findOneAndUpdate({ _id: id, userId }, { $set: { status: "CANCELLED" } }, { new: true });
    if (!request) throw new ApiError(404, "Payment request not found");
    return request;
  },

  async markShared(userId: string, id: string) {
    const request = await PaymentRequestModel.findOneAndUpdate({ _id: id, userId }, { $set: { status: "SHARED" } }, { new: true });
    if (!request) throw new ApiError(404, "Payment request not found");
    return request;
  },

  async getPublic(token: string) {
    const request = await PaymentRequestModel.findOne({ publicToken: token }).populate("contactId", "name").populate("loanId", "status");
    if (!request || request.status === "CANCELLED" || (request.expiresAt && request.expiresAt.getTime() < Date.now())) {
      throw new ApiError(404, "Payment request not found or expired");
    }
    const contactName = request.contactId && typeof request.contactId === "object" && "name" in request.contactId ? String((request.contactId as { name?: string }).name || "Contact") : "Contact";
    return {
      requestNumber: request.requestNumber,
      contactName,
      amountRequested: request.amountRequested,
      remainingAmount: request.remainingAmount,
      dueDate: request.dueDate,
      message: request.message,
      status: request.status,
      expiresAt: request.expiresAt,
      appName: "Loan Tracker",
    };
  },
};
