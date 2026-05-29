import { Types } from "mongoose";
import { LoanStatus, LoanType } from "../../constants/enums";
import { ApiError } from "../../utils/apiError";
import {
  calculateLoanStatus,
  calculateRemainingAmount,
  getPaymentTypeForLoan,
} from "../../utils/loanCalculations";
import { buildPaginationMeta } from "../../utils/pagination";
import { ContactModel } from "../contacts/contact.model";
import { PaymentModel } from "../payments/payment.model";
import { PaymentProofModel } from "../payments/proofs/payment-proof.model";
import { localStorageService } from "../../storage/local-storage.service";
import { PaymentMethod } from "../../constants/enums";
import { ILoan, LoanModel } from "./loan.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

const todayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getInterestMonths = (issueDate: Date, dueDate?: Date) => {
  if (!dueDate) return 1;
  const years = dueDate.getFullYear() - issueDate.getFullYear();
  const months = dueDate.getMonth() - issueDate.getMonth();
  return Math.max(years * 12 + months + 1, 1);
};

const calculateInterestAmount = (
  amount: number,
  interestEnabled: boolean,
  interestType?: "SIMPLE" | "MONTHLY",
  interestRate = 0,
  issueDate = new Date(),
  dueDate?: Date,
) => {
  if (!interestEnabled || interestRate <= 0) return 0;
  const multiplier = interestType === "MONTHLY" ? getInterestMonths(issueDate, dueDate) : 1;
  return Math.round(amount * (interestRate / 100) * multiplier);
};

const getRepaymentTarget = (loan: { amount: number; totalPayableAmount?: number }) =>
  loan.totalPayableAmount && loan.totalPayableAmount > 0 ? loan.totalPayableAmount : loan.amount;

const normalizeLoanPayload = <T extends Record<string, unknown>>(payload: T) => {
  const normalized = { ...payload };
  if ((normalized as Record<string, unknown>).description === "") {
    (normalized as Record<string, unknown>).description = undefined;
  }
  if ((normalized as Record<string, unknown>).dueDate === "") {
    (normalized as Record<string, unknown>).dueDate = undefined;
  }
  return normalized;
};

export const loanService = {
  async ensureContactBelongsToUser(userId: string, contactId: string) {
    const contact = await ContactModel.findOne({ _id: contactId, userId }).select("_id");
    if (!contact) {
      throw new ApiError(404, "Contact not found");
    }
  },

  async refreshOverdueLoans(userId: string) {
    await LoanModel.updateMany(
      {
        userId,
        remainingAmount: { $gt: 0 },
        dueDate: { $lt: todayStart() },
        status: { $ne: LoanStatus.OVERDUE },
      },
      { $set: { status: LoanStatus.OVERDUE } },
    );
  },

  async recalculateLoanTotals(loanId: string, userId: string) {
    const loan = await LoanModel.findOne({ _id: loanId, userId });
    if (!loan) {
      throw new ApiError(404, "Loan not found");
    }

    const result = await PaymentModel.aggregate<{ _id: null; paidAmount: number }>([
      { $match: { loanId: toObjectId(loanId), userId: toObjectId(userId) } },
      { $group: { _id: null, paidAmount: { $sum: "$amount" } } },
    ]);

    const paidAmount = result[0]?.paidAmount || 0;

    if (paidAmount > loan.amount) {
      const targetAmount = getRepaymentTarget(loan);
      if (paidAmount > targetAmount) {
        throw new ApiError(400, "Total payments cannot exceed loan payable amount");
      }
    }

    const targetAmount = getRepaymentTarget(loan);
    loan.paidAmount = paidAmount;
    loan.remainingAmount = calculateRemainingAmount(targetAmount, paidAmount);
    loan.status = calculateLoanStatus(targetAmount, paidAmount, loan.dueDate);

    await loan.save();

    return loan;
  },

  async createLoan(
    userId: string,
    payload: {
      contactId: string;
      type: LoanType;
      amount: number;
      issueDate?: Date;
      dueDate?: Date;
      description?: string;
      isInstallmentLoan?: boolean;
      installmentFrequency?: "MONTHLY" | "WEEKLY" | "CUSTOM";
      installmentAmount?: number;
      totalInstallments?: number;
      installmentStartDate?: Date;
      interestEnabled?: boolean;
      interestType?: "SIMPLE" | "MONTHLY";
      interestRate?: number;
    },
  ) {
    await this.ensureContactBelongsToUser(userId, payload.contactId);

    const normalized = normalizeLoanPayload(payload);
    const paidAmount = 0;
    const interestAmount = calculateInterestAmount(
      payload.amount,
      Boolean(payload.interestEnabled),
      payload.interestType,
      payload.interestRate,
      (normalized.issueDate as Date | undefined) || new Date(),
      normalized.dueDate as Date | undefined,
    );
    const totalPayableAmount = payload.amount + interestAmount;
    const remainingAmount = calculateRemainingAmount(totalPayableAmount, paidAmount);
    const status = calculateLoanStatus(totalPayableAmount, paidAmount, normalized.dueDate as Date | undefined);

    return LoanModel.create({
      ...normalized,
      userId,
      paidAmount,
      remainingAmount,
      status,
      totalPayableAmount,
      interestEnabled: Boolean(payload.interestEnabled),
      interestType: payload.interestEnabled ? payload.interestType || "SIMPLE" : undefined,
      interestRate: payload.interestEnabled ? payload.interestRate || 0 : undefined,
      interestAmount,
    });
  },

  async getLoans(
    userId: string,
    query: {
      search?: string;
      type?: LoanType;
      status?: LoanStatus;
      contactId?: string;
      minAmount?: number;
      maxAmount?: number;
      issueDateFrom?: Date;
      issueDateTo?: Date;
      dueDateFrom?: Date;
      dueDateTo?: Date;
      paymentMethod?: PaymentMethod;
      hasProof?: boolean;
      sortBy?: "issueDate" | "dueDate" | "amount" | "remainingAmount" | "createdAt";
      sortOrder?: "asc" | "desc";
      page: number;
      limit: number;
    },
  ) {
    await this.refreshOverdueLoans(userId);

    const filter: Record<string, unknown> = { userId };

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      filter.amount = {
        ...(query.minAmount !== undefined ? { $gte: query.minAmount } : {}),
        ...(query.maxAmount !== undefined ? { $lte: query.maxAmount } : {}),
      };
    }
    if (query.issueDateFrom || query.issueDateTo) {
      filter.issueDate = {
        ...(query.issueDateFrom ? { $gte: query.issueDateFrom } : {}),
        ...(query.issueDateTo ? { $lte: query.issueDateTo } : {}),
      };
    }
    if (query.dueDateFrom || query.dueDateTo) {
      filter.dueDate = {
        ...(query.dueDateFrom ? { $gte: query.dueDateFrom } : {}),
        ...(query.dueDateTo ? { $lte: query.dueDateTo } : {}),
      };
    }
    if (query.contactId) {
      await this.ensureContactBelongsToUser(userId, query.contactId);
      filter.contactId = query.contactId;
    }

    if (query.paymentMethod) {
      const matchingPayments = await PaymentModel.find({ userId, method: query.paymentMethod }).select("loanId");
      filter._id = { $in: matchingPayments.map((payment) => payment.loanId) };
    }

    if (query.hasProof !== undefined) {
      const proofLoanIds = await PaymentProofModel.distinct("loanId", { userId });
      const currentIdFilter = filter._id as { $in?: Types.ObjectId[] } | undefined;
      if (query.hasProof) {
        const proofSet = new Set(proofLoanIds.map((id) => id.toString()));
        filter._id = {
          $in: currentIdFilter?.$in
            ? currentIdFilter.$in.filter((id) => proofSet.has(id.toString()))
            : proofLoanIds,
        };
      } else {
        filter._id = { ...(currentIdFilter || {}), $nin: proofLoanIds };
      }
    }

    if (query.search) {
      const regex = new RegExp(query.search, "i");
      const matchingContacts = await ContactModel.find({
        userId,
        name: regex,
      }).select("_id");

      filter.$or = [
        { description: regex },
        { contactId: { $in: matchingContacts.map((contact) => contact._id) } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const sortField = query.sortBy || "issueDate";
    const sortDirection = query.sortOrder === "asc" ? 1 : -1;
    const [loans, total] = await Promise.all([
      LoanModel.find(filter)
        .populate("contactId", "name phone email")
        .sort({ [sortField]: sortDirection, createdAt: -1 })
        .skip(skip)
        .limit(query.limit),
      LoanModel.countDocuments(filter),
    ]);

    return {
      loans,
      pagination: buildPaginationMeta(query.page, query.limit, total),
    };
  },

  async getLoanOrThrow(userId: string, loanId: string) {
    const loan = await LoanModel.findOne({ _id: loanId, userId });
    if (!loan) {
      throw new ApiError(404, "Loan not found");
    }

    return loan;
  },

  async getLoanDetail(userId: string, loanId: string) {
    await this.refreshOverdueLoans(userId);

    const loan = await LoanModel.findOne({ _id: loanId, userId }).populate("contactId", "name phone email note");
    if (!loan) {
      throw new ApiError(404, "Loan not found");
    }

    const [payments, proofs] = await Promise.all([
      PaymentModel.find({ userId, loanId }).sort({ paymentDate: -1, createdAt: -1 }),
      PaymentProofModel.find({ userId, loanId }),
    ]);
    const proofByPaymentId = new Map(proofs.map((proof) => [proof.paymentId.toString(), proof]));

    return {
      loan,
      payments: payments.map((payment) => ({
        ...payment.toObject(),
        proof: proofByPaymentId.get(payment._id.toString()) || null,
      })),
    };
  },

  async getPinnedLoans(userId: string, limit = 10) {
    await this.refreshOverdueLoans(userId);
    return LoanModel.find({ userId, isPinned: true })
      .populate("contactId", "name phone email")
      .sort({ updatedAt: -1 })
      .limit(limit);
  },

  async setPinned(userId: string, loanId: string, isPinned: boolean) {
    const loan = await LoanModel.findOneAndUpdate(
      { _id: loanId, userId },
      { $set: { isPinned } },
      { new: true, runValidators: true },
    ).populate("contactId", "name phone email");

    if (!loan) {
      throw new ApiError(404, "Loan not found");
    }

    return loan;
  },

  async updateLoan(
    userId: string,
    loanId: string,
    payload: Partial<{
      contactId: string;
      type: LoanType;
      amount: number;
      issueDate: Date;
      dueDate?: Date | "";
      description?: string;
      isInstallmentLoan?: boolean;
      installmentFrequency?: "MONTHLY" | "WEEKLY" | "CUSTOM";
      installmentAmount?: number;
      totalInstallments?: number;
      installmentStartDate?: Date;
      interestEnabled?: boolean;
      interestType?: "SIMPLE" | "MONTHLY";
      interestRate?: number;
    }>,
  ) {
    const loan = await this.getLoanOrThrow(userId, loanId);
    const normalized = normalizeLoanPayload(payload);

    if (normalized.contactId) {
      await this.ensureContactBelongsToUser(userId, normalized.contactId as string);
      loan.contactId = toObjectId(normalized.contactId as string);
    }

    if (normalized.amount !== undefined) {
      const amount = normalized.amount as number;
      if (amount < loan.paidAmount) {
        throw new ApiError(400, "Loan amount cannot be lower than already paid amount");
      }

      loan.amount = amount;
    }

    if (normalized.type) loan.type = normalized.type as LoanType;
    if (normalized.issueDate) loan.issueDate = normalized.issueDate as Date;
    if ("dueDate" in normalized) loan.dueDate = normalized.dueDate as Date | undefined;
    if ("description" in normalized) loan.description = normalized.description as string | undefined;
    if (normalized.isInstallmentLoan !== undefined) loan.isInstallmentLoan = Boolean(normalized.isInstallmentLoan);
    if (normalized.installmentFrequency) loan.installmentFrequency = normalized.installmentFrequency as "MONTHLY" | "WEEKLY" | "CUSTOM";
    if (normalized.installmentAmount !== undefined) loan.installmentAmount = normalized.installmentAmount as number;
    if (normalized.totalInstallments !== undefined) loan.totalInstallments = normalized.totalInstallments as number;
    if (normalized.installmentStartDate) loan.installmentStartDate = normalized.installmentStartDate as Date;
    if (normalized.interestEnabled !== undefined) loan.interestEnabled = Boolean(normalized.interestEnabled);
    if (normalized.interestType) loan.interestType = normalized.interestType as "SIMPLE" | "MONTHLY";
    if (normalized.interestRate !== undefined) loan.interestRate = normalized.interestRate as number;

    loan.interestAmount = calculateInterestAmount(
      loan.amount,
      loan.interestEnabled,
      loan.interestType,
      loan.interestRate,
      loan.issueDate,
      loan.dueDate,
    );
    loan.totalPayableAmount = loan.amount + loan.interestAmount;
    loan.remainingAmount = calculateRemainingAmount(loan.totalPayableAmount, loan.paidAmount);
    loan.status = calculateLoanStatus(loan.totalPayableAmount, loan.paidAmount, loan.dueDate);

    await loan.save();

    await PaymentModel.updateMany(
      { userId, loanId },
      {
        $set: {
          contactId: loan.contactId,
          type: getPaymentTypeForLoan(loan.type),
        },
      },
    );

    return loan.populate("contactId", "name phone email");
  },

  async getInterestPreview(
    userId: string,
    loanId: string,
    payload: Partial<{ interestEnabled: boolean; interestType: "SIMPLE" | "MONTHLY"; interestRate: number }> = {},
  ) {
    const loan = await this.getLoanOrThrow(userId, loanId);
    const interestEnabled = payload.interestEnabled ?? loan.interestEnabled;
    const interestType = payload.interestType ?? loan.interestType ?? "SIMPLE";
    const interestRate = payload.interestRate ?? loan.interestRate ?? 0;
    const interestAmount = calculateInterestAmount(loan.amount, interestEnabled, interestType, interestRate, loan.issueDate, loan.dueDate);
    const totalPayableAmount = loan.amount + interestAmount;

    return {
      principalAmount: loan.amount,
      interestEnabled,
      interestType,
      interestRate,
      interestAmount,
      totalPayableAmount,
      paidAmount: loan.paidAmount,
      remainingAmount: calculateRemainingAmount(totalPayableAmount, loan.paidAmount),
    };
  },

  async updateInterest(
    userId: string,
    loanId: string,
    payload: { interestEnabled: boolean; interestType?: "SIMPLE" | "MONTHLY"; interestRate?: number },
  ) {
    const loan = await this.getLoanOrThrow(userId, loanId);
    loan.interestEnabled = payload.interestEnabled;
    loan.interestType = payload.interestEnabled ? payload.interestType || loan.interestType || "SIMPLE" : undefined;
    loan.interestRate = payload.interestEnabled ? payload.interestRate ?? loan.interestRate ?? 0 : undefined;
    loan.interestAmount = calculateInterestAmount(
      loan.amount,
      loan.interestEnabled,
      loan.interestType,
      loan.interestRate,
      loan.issueDate,
      loan.dueDate,
    );
    loan.totalPayableAmount = loan.amount + loan.interestAmount;

    if (loan.totalPayableAmount < loan.paidAmount) {
      throw new ApiError(400, "Total payable amount cannot be lower than already paid amount");
    }

    loan.remainingAmount = calculateRemainingAmount(loan.totalPayableAmount, loan.paidAmount);
    loan.status = calculateLoanStatus(loan.totalPayableAmount, loan.paidAmount, loan.dueDate);
    await loan.save();
    return loan.populate("contactId", "name phone email");
  },

  async deleteLoan(userId: string, loanId: string) {
    const loan = await this.getLoanOrThrow(userId, loanId);
    const contactId = loan.contactId.toString();
    const proofs = await PaymentProofModel.find({ userId, loanId });

    await Promise.all([
      ...proofs.map((proof) => localStorageService.remove(proof.storagePath)),
      PaymentProofModel.deleteMany({ userId, loanId }),
      PaymentModel.deleteMany({ userId, loanId }),
      loan.deleteOne(),
    ]);

    return { id: loanId, contactId };
  },
};
