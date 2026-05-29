import { Types } from "mongoose";
import { LoanStatus } from "../../constants/enums";
import { calculateTrustScore, getLoanTrustStatus } from "../../utils/trustScore";
import { ApiError } from "../../utils/apiError";
import { ContactModel } from "../contacts/contact.model";
import { LoanModel } from "../loans/loan.model";
import { PaymentModel } from "../payments/payment.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

export const trustService = {
  async getContactTrustProfile(userId: string, contactId: string) {
    const contact = await ContactModel.findOne({ _id: contactId, userId }).select("_id name");
    if (!contact) {
      throw new ApiError(404, "Contact not found");
    }

    const loans = await LoanModel.find({ userId, contactId }).sort({ createdAt: 1 });
    const payments = await PaymentModel.find({ userId, contactId }).sort({ paymentDate: 1 });
    const lastPayment = payments[payments.length - 1];
    const completedLoans = loans.filter((loan) => loan.status === LoanStatus.COMPLETED);
    const activeLoans = loans.filter((loan) => [LoanStatus.ACTIVE, LoanStatus.PARTIALLY_PAID].includes(loan.status));
    const overdueLoans = loans.filter((loan) => loan.status === LoanStatus.OVERDUE);
    const completedLoanIds = new Set(completedLoans.map((loan) => loan._id.toString()));

    const repaymentDays = completedLoans.map((loan) => {
      const latestPayment = payments
        .filter((payment) => payment.loanId.toString() === loan._id.toString())
        .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())[0];
      const paidAt = latestPayment?.paymentDate || loan.updatedAt;
      return Math.max(1, Math.round((paidAt.getTime() - loan.issueDate.getTime()) / 86_400_000));
    });

    const onTimeCount = completedLoans.filter((loan) => {
      const latestPayment = payments
        .filter((payment) => payment.loanId.toString() === loan._id.toString())
        .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())[0];
      return getLoanTrustStatus(loan.status, loan.dueDate, latestPayment?.paymentDate) === "ON_TIME";
    }).length;

    const totalLoans = loans.length;
    const onTimePaymentRate = completedLoans.length ? onTimeCount / completedLoans.length : 0;
    const overdueFrequency = totalLoans ? overdueLoans.length / totalLoans : 0;
    const score = calculateTrustScore({
      totalLoans,
      completedLoans: completedLoans.length,
      activeLoans: activeLoans.length,
      overdueLoans: overdueLoans.length,
      onTimePaymentRate,
      overdueFrequency,
    });

    const totalDealingAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const averageRepaymentDays = Math.round(average(repaymentDays));
    const summary = score.label === "NEW"
      ? `${contact.name} ke saath abhi enough history nahi hai.`
      : score.label === "RISKY"
        ? `${contact.name} ke account mein overdue pattern nazar aa raha hai.`
        : `${contact.name} ka repayment behavior stable lag raha hai.`;

    const recommendations = [
      score.label === "RISKY" ? "New loans se pehle smaller amount ya shorter due date rakhein." : "Payment history ko updated rakhein.",
      overdueLoans.length ? "Overdue loans par reminder bhejein." : "No overdue pressure right now.",
      completedLoanIds.size ? "Completed loans ka receipt/share summary generate kar sakte hain." : "First completed repayment trust profile ko stronger banayegi.",
    ];

    return {
      contactId,
      trustScore: score.trustScore,
      label: score.label,
      totalLoans,
      completedLoans: completedLoans.length,
      activeLoans: activeLoans.length,
      overdueLoans: overdueLoans.length,
      totalDealingAmount,
      averageRepaymentDays,
      onTimePaymentRate: Math.round(onTimePaymentRate * 100),
      overdueFrequency: Math.round(overdueFrequency * 100),
      lastPaymentDate: lastPayment?.paymentDate,
      summary,
      recommendations,
    };
  },
};
