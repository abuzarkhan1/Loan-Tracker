import { Types } from "mongoose";
import { PaymentMethod } from "../../constants/enums";
import { ApiError } from "../../utils/apiError";
import { calculateRemainingAmount } from "../../utils/loanCalculations";
import { loanService } from "../loans/loan.service";
import { paymentService } from "../payments/payment.service";
import { InstallmentModel, InstallmentStatus } from "./installment.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

const nextDueDate = (startDate: Date, index: number, frequency?: string) => {
  const date = new Date(startDate);
  if (frequency === "WEEKLY") {
    date.setDate(date.getDate() + index * 7);
    return date;
  }
  date.setMonth(date.getMonth() + index);
  return date;
};

const getInstallmentStatus = (expectedAmount: number, paidAmount: number, dueDate: Date) => {
  const remainingAmount = calculateRemainingAmount(expectedAmount, paidAmount);
  if (remainingAmount <= 0) return InstallmentStatus.PAID;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dueDate < today) return InstallmentStatus.OVERDUE;
  if (paidAmount > 0) return InstallmentStatus.PARTIAL;
  return InstallmentStatus.UPCOMING;
};

export const installmentService = {
  async generateInstallments(userId: string, loanId: string) {
    const loan = await loanService.getLoanOrThrow(userId, loanId);
    if (!loan.isInstallmentLoan) {
      throw new ApiError(400, "Loan is not marked as an installment loan");
    }
    if (!loan.installmentAmount || !loan.totalInstallments || !loan.installmentStartDate) {
      throw new ApiError(400, "Installment amount, total installments, and start date are required");
    }

    await InstallmentModel.deleteMany({ userId, loanId });

    const installments = Array.from({ length: loan.totalInstallments }).map((_, index) => {
      const dueDate = nextDueDate(loan.installmentStartDate!, index, loan.installmentFrequency);
      const isLast = index === loan.totalInstallments! - 1;
      const expectedAmount = isLast
        ? Math.max(loan.amount - loan.installmentAmount! * (loan.totalInstallments! - 1), 0.01)
        : loan.installmentAmount!;

      return {
        userId: toObjectId(userId),
        loanId: loan._id,
        installmentNumber: index + 1,
        dueDate,
        expectedAmount,
        paidAmount: 0,
        remainingAmount: expectedAmount,
        status: getInstallmentStatus(expectedAmount, 0, dueDate),
      };
    });

    return InstallmentModel.insertMany(installments);
  },

  async getLoanInstallments(userId: string, loanId: string) {
    await loanService.getLoanOrThrow(userId, loanId);
    await this.refreshInstallmentStatuses(userId, loanId);
    return InstallmentModel.find({ userId, loanId }).sort({ installmentNumber: 1 });
  },

  async getInstallmentOrThrow(userId: string, installmentId: string) {
    const installment = await InstallmentModel.findOne({ _id: installmentId, userId });
    if (!installment) throw new ApiError(404, "Installment not found");
    return installment;
  },

  async updateInstallment(
    userId: string,
    installmentId: string,
    payload: Partial<{ dueDate: Date; expectedAmount: number; status: InstallmentStatus }>,
  ) {
    const installment = await this.getInstallmentOrThrow(userId, installmentId);
    if (payload.dueDate) installment.dueDate = payload.dueDate;
    if (payload.expectedAmount !== undefined) {
      if (payload.expectedAmount < installment.paidAmount) {
        throw new ApiError(400, "Expected amount cannot be lower than already paid amount");
      }
      installment.expectedAmount = payload.expectedAmount;
      installment.remainingAmount = calculateRemainingAmount(payload.expectedAmount, installment.paidAmount);
    }
    installment.status = payload.status || getInstallmentStatus(installment.expectedAmount, installment.paidAmount, installment.dueDate);
    await installment.save();
    return installment;
  },

  async payInstallment(
    userId: string,
    installmentId: string,
    payload: { amount: number; method: PaymentMethod; paymentDate?: Date; note?: string },
  ) {
    const installment = await this.getInstallmentOrThrow(userId, installmentId);
    if (payload.amount > installment.remainingAmount) {
      throw new ApiError(400, "Payment cannot be greater than installment remaining amount");
    }

    const paymentResult = await paymentService.addPayment(userId, {
      loanId: installment.loanId.toString(),
      amount: payload.amount,
      method: payload.method,
      paymentDate: payload.paymentDate,
      note: payload.note,
    });

    installment.paidAmount += payload.amount;
    installment.remainingAmount = calculateRemainingAmount(installment.expectedAmount, installment.paidAmount);
    installment.status = getInstallmentStatus(installment.expectedAmount, installment.paidAmount, installment.dueDate);
    installment.paidAt = installment.remainingAmount <= 0 ? new Date() : installment.paidAt;
    await installment.save();

    return {
      installment,
      payment: paymentResult.payment,
      loan: paymentResult.loan,
    };
  },

  async getUpcoming(userId: string) {
    await this.refreshInstallmentStatuses(userId);
    return InstallmentModel.find({
      userId,
      status: { $in: [InstallmentStatus.UPCOMING, InstallmentStatus.PARTIAL, InstallmentStatus.OVERDUE] },
    })
      .populate("loanId", "amount remainingAmount status contactId")
      .sort({ dueDate: 1 })
      .limit(50);
  },

  async refreshInstallmentStatuses(userId: string, loanId?: string) {
    const filter = { userId, ...(loanId ? { loanId } : {}) };
    const installments = await InstallmentModel.find(filter);
    await Promise.all(
      installments.map(async (installment) => {
        const nextStatus = getInstallmentStatus(installment.expectedAmount, installment.paidAmount, installment.dueDate);
        if (nextStatus !== installment.status) {
          installment.status = nextStatus;
          await installment.save();
        }
      }),
    );
  },
};
