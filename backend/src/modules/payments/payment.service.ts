import { ApiError } from "../../utils/apiError";
import { getPaymentTypeForLoan } from "../../utils/loanCalculations";
import { loanService } from "../loans/loan.service";
import { LoanModel } from "../loans/loan.model";
import { PaymentMethod } from "../../constants/enums";
import { PaymentModel } from "./payment.model";

const normalizePaymentPayload = <T extends Record<string, unknown>>(payload: T) => {
  const normalized = { ...payload };
  if ((normalized as Record<string, unknown>).note === "") {
    (normalized as Record<string, unknown>).note = undefined;
  }
  return normalized;
};

export const paymentService = {
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

    return {
      payment,
      loan: updatedLoan,
    };
  },

  async getPaymentsByLoan(userId: string, loanId: string) {
    await loanService.getLoanOrThrow(userId, loanId);
    return PaymentModel.find({ userId, loanId }).sort({ paymentDate: -1, createdAt: -1 });
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
    await payment.deleteOne();
    const updatedLoan = await loanService.recalculateLoanTotals(loanId, userId);

    return {
      id: paymentId,
      loan: updatedLoan,
    };
  },
};
