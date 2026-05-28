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
import { ILoan, LoanModel } from "./loan.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

const todayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

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
      throw new ApiError(400, "Total payments cannot exceed loan amount");
    }

    loan.paidAmount = paidAmount;
    loan.remainingAmount = calculateRemainingAmount(loan.amount, paidAmount);
    loan.status = calculateLoanStatus(loan.amount, paidAmount, loan.dueDate);

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
    },
  ) {
    await this.ensureContactBelongsToUser(userId, payload.contactId);

    const normalized = normalizeLoanPayload(payload);
    const paidAmount = 0;
    const remainingAmount = calculateRemainingAmount(payload.amount, paidAmount);
    const status = calculateLoanStatus(payload.amount, paidAmount, normalized.dueDate as Date | undefined);

    return LoanModel.create({
      ...normalized,
      userId,
      paidAmount,
      remainingAmount,
      status,
    });
  },

  async getLoans(
    userId: string,
    query: {
      search?: string;
      type?: LoanType;
      status?: LoanStatus;
      contactId?: string;
      page: number;
      limit: number;
    },
  ) {
    await this.refreshOverdueLoans(userId);

    const filter: Record<string, unknown> = { userId };

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.contactId) {
      await this.ensureContactBelongsToUser(userId, query.contactId);
      filter.contactId = query.contactId;
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
    const [loans, total] = await Promise.all([
      LoanModel.find(filter)
        .populate("contactId", "name phone email")
        .sort({ issueDate: -1, createdAt: -1 })
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

    const payments = await PaymentModel.find({ userId, loanId }).sort({ paymentDate: -1, createdAt: -1 });

    return {
      loan,
      payments,
    };
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

    loan.remainingAmount = calculateRemainingAmount(loan.amount, loan.paidAmount);
    loan.status = calculateLoanStatus(loan.amount, loan.paidAmount, loan.dueDate);

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

  async deleteLoan(userId: string, loanId: string) {
    const loan = await this.getLoanOrThrow(userId, loanId);

    await Promise.all([
      PaymentModel.deleteMany({ userId, loanId }),
      loan.deleteOne(),
    ]);

    return { id: loanId };
  },
};
