import { ApiError } from "../../utils/apiError";
import { getPaymentTypeForLoan } from "../../utils/loanCalculations";
import { loanService } from "../loans/loan.service";
import { LoanModel } from "../loans/loan.model";
import { PaymentMethod } from "../../constants/enums";
import { PaymentModel } from "./payment.model";
import { PaymentProofModel } from "./proofs/payment-proof.model";
import { localStorageService } from "../../storage/local-storage.service";
import { buildPaginationMeta } from "../../utils/pagination";
import { ContactModel } from "../contacts/contact.model";
import { promiseService } from "../promises/promise.service";
import { transactionService } from "../transactions/transaction.service";

const normalizePaymentPayload = <T extends Record<string, unknown>>(payload: T) => {
  const normalized = { ...payload };
  if ((normalized as Record<string, unknown>).note === "") {
    (normalized as Record<string, unknown>).note = undefined;
  }
  return normalized;
};

export const paymentService = {
  async getPayments(
    userId: string,
    query: {
      search?: string;
      loanId?: string;
      contactId?: string;
      method?: PaymentMethod;
      minAmount?: number;
      maxAmount?: number;
      paymentDateFrom?: Date;
      paymentDateTo?: Date;
      hasProof?: boolean;
      sortBy?: "paymentDate" | "amount" | "createdAt";
      sortOrder?: "asc" | "desc";
      page: number;
      limit: number;
    },
  ) {
    const filter: Record<string, unknown> = { userId };

    if (query.loanId) {
      await loanService.getLoanOrThrow(userId, query.loanId);
      filter.loanId = query.loanId;
    }
    if (query.contactId) {
      const contact = await ContactModel.findOne({ _id: query.contactId, userId }).select("_id");
      if (!contact) throw new ApiError(404, "Contact not found");
      filter.contactId = query.contactId;
    }
    if (query.method) filter.method = query.method;
    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      filter.amount = {
        ...(query.minAmount !== undefined ? { $gte: query.minAmount } : {}),
        ...(query.maxAmount !== undefined ? { $lte: query.maxAmount } : {}),
      };
    }
    if (query.paymentDateFrom || query.paymentDateTo) {
      filter.paymentDate = {
        ...(query.paymentDateFrom ? { $gte: query.paymentDateFrom } : {}),
        ...(query.paymentDateTo ? { $lte: query.paymentDateTo } : {}),
      };
    }
    if (query.search) {
      filter.note = new RegExp(query.search, "i");
    }
    if (query.hasProof !== undefined) {
      const proofPaymentIds = await PaymentProofModel.distinct("paymentId", { userId });
      filter._id = query.hasProof ? { $in: proofPaymentIds } : { $nin: proofPaymentIds };
    }

    const skip = (query.page - 1) * query.limit;
    const sortField = query.sortBy || "paymentDate";
    const sortDirection = query.sortOrder === "asc" ? 1 : -1;
    const [payments, total, proofs] = await Promise.all([
      PaymentModel.find(filter)
        .populate("contactId", "name phone")
        .populate("loanId", "amount remainingAmount status type")
        .sort({ [sortField]: sortDirection, createdAt: -1 })
        .skip(skip)
        .limit(query.limit),
      PaymentModel.countDocuments(filter),
      PaymentProofModel.find({ userId }),
    ]);
    const proofByPaymentId = new Map(proofs.map((proof) => [proof.paymentId.toString(), proof]));

    return {
      payments: payments.map((payment) => ({
        ...payment.toObject(),
        proof: proofByPaymentId.get(payment._id.toString()) || null,
      })),
      pagination: buildPaginationMeta(query.page, query.limit, total),
    };
  },

  async addPayment(
    userId: string,
    payload: {
      loanId: string;
      amount: number;
      method: PaymentMethod;
      paymentDate?: Date;
      note?: string;
    },
  ) {
    const loan = await LoanModel.findOne({ _id: payload.loanId, userId });
    if (!loan) {
      throw new ApiError(404, "Loan not found");
    }

    if (payload.amount > loan.remainingAmount) {
      throw new ApiError(400, "Payment cannot be greater than remaining amount");
    }

    const payment = await PaymentModel.create({
      ...normalizePaymentPayload(payload),
      userId,
      contactId: loan.contactId,
      type: getPaymentTypeForLoan(loan.type),
    });

    const updatedLoan = await loanService.recalculateLoanTotals(loan._id.toString(), userId);
    await transactionService.upsertLoanPaymentTransaction(userId, payment, loan);
    const promiseSuggestion = await promiseService.getPaymentPromiseSuggestion(
      userId,
      loan._id.toString(),
      payment.amount,
      payment.paymentDate,
    );

    return {
      payment,
      loan: updatedLoan,
      promiseSuggestion,
    };
  },

  async getPaymentsByLoan(userId: string, loanId: string) {
    await loanService.getLoanOrThrow(userId, loanId);
    const [payments, proofs] = await Promise.all([
      PaymentModel.find({ userId, loanId }).sort({ paymentDate: -1, createdAt: -1 }),
      PaymentProofModel.find({ userId, loanId }),
    ]);
    const proofByPaymentId = new Map(proofs.map((proof) => [proof.paymentId.toString(), proof]));

    return payments.map((payment) => ({
      ...payment.toObject(),
      proof: proofByPaymentId.get(payment._id.toString()) || null,
    }));
  },

  async updatePayment(
    userId: string,
    paymentId: string,
    payload: Partial<{
      amount: number;
      method: PaymentMethod;
      paymentDate: Date;
      note?: string;
    }>,
  ) {
    const payment = await PaymentModel.findOne({ _id: paymentId, userId });
    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    const loan = await LoanModel.findOne({ _id: payment.loanId, userId });
    if (!loan) {
      throw new ApiError(404, "Loan not found");
    }

    const normalized = normalizePaymentPayload(payload);
    const nextAmount = normalized.amount !== undefined ? (normalized.amount as number) : payment.amount;
    const availableAmount = loan.remainingAmount + payment.amount;

    if (nextAmount > availableAmount) {
      throw new ApiError(400, "Payment cannot be greater than remaining amount");
    }

    if (normalized.amount !== undefined) payment.amount = nextAmount;
    if (normalized.method) payment.method = normalized.method as PaymentMethod;
    if (normalized.paymentDate) payment.paymentDate = normalized.paymentDate as Date;
    if ("note" in normalized) payment.note = normalized.note as string | undefined;

    payment.contactId = loan.contactId;
    payment.type = getPaymentTypeForLoan(loan.type);

    await payment.save();
    const updatedLoan = await loanService.recalculateLoanTotals(loan._id.toString(), userId);
    await transactionService.upsertLoanPaymentTransaction(userId, payment, loan);

    return {
      payment,
      loan: updatedLoan,
    };
  },

  async deletePayment(userId: string, paymentId: string) {
    const payment = await PaymentModel.findOne({ _id: paymentId, userId });
    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    const loanId = payment.loanId.toString();
    const proof = await PaymentProofModel.findOne({ paymentId, userId });
    await transactionService.deleteByPayment(userId, paymentId);
    await payment.deleteOne();
    if (proof) {
      await localStorageService.remove(proof.storagePath);
      await proof.deleteOne();
    }
    const updatedLoan = await loanService.recalculateLoanTotals(loanId, userId);

    return {
      id: paymentId,
      loan: updatedLoan,
    };
  },
};
