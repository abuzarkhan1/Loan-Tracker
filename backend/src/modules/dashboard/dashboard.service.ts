import { Types } from "mongoose";
import { LoanStatus, LoanType, PaymentType } from "../../constants/enums";
import { LoanModel } from "../loans/loan.model";
import { loanService } from "../loans/loan.service";
import { PaymentModel } from "../payments/payment.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const buildMonthBuckets = (months = 12) => {
  const buckets: Record<string, { month: string; given: number; taken: number; received: number; paid: number }> = {};
  const now = new Date();

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    buckets[monthKey(date)] = {
      month: monthKey(date),
      given: 0,
      taken: 0,
      received: 0,
      paid: 0,
    };
  }

  return buckets;
};

export const dashboardService = {
  async getSummary(userId: string) {
    await loanService.refreshOverdueLoans(userId);

    const result = await LoanModel.aggregate([
      { $match: { userId: toObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalLoanGiven: {
            $sum: { $cond: [{ $eq: ["$type", LoanType.GIVEN] }, "$amount", 0] },
          },
          totalLoanTaken: {
            $sum: { $cond: [{ $eq: ["$type", LoanType.TAKEN] }, "$amount", 0] },
          },
          totalReceivedBack: {
            $sum: { $cond: [{ $eq: ["$type", LoanType.GIVEN] }, "$paidAmount", 0] },
          },
          totalPaidBack: {
            $sum: { $cond: [{ $eq: ["$type", LoanType.TAKEN] }, "$paidAmount", 0] },
          },
          netReceivable: {
            $sum: { $cond: [{ $eq: ["$type", LoanType.GIVEN] }, "$remainingAmount", 0] },
          },
          netPayable: {
            $sum: { $cond: [{ $eq: ["$type", LoanType.TAKEN] }, "$remainingAmount", 0] },
          },
          activeLoans: {
            $sum: {
              $cond: [{ $in: ["$status", [LoanStatus.ACTIVE, LoanStatus.PARTIALLY_PAID]] }, 1, 0],
            },
          },
          completedLoans: {
            $sum: { $cond: [{ $eq: ["$status", LoanStatus.COMPLETED] }, 1, 0] },
          },
          overdueLoans: {
            $sum: { $cond: [{ $eq: ["$status", LoanStatus.OVERDUE] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalLoanGiven: 1,
          totalLoanTaken: 1,
          totalReceivedBack: 1,
          totalPaidBack: 1,
          netReceivable: 1,
          netPayable: 1,
          overallBalance: { $subtract: ["$netReceivable", "$netPayable"] },
          activeLoans: 1,
          completedLoans: 1,
          overdueLoans: 1,
        },
      },
    ]);

    return (
      result[0] || {
        totalLoanGiven: 0,
        totalLoanTaken: 0,
        totalReceivedBack: 0,
        totalPaidBack: 0,
        netReceivable: 0,
        netPayable: 0,
        overallBalance: 0,
        activeLoans: 0,
        completedLoans: 0,
        overdueLoans: 0,
      }
    );
  },

  async getMonthlyChart(userId: string, months = 12) {
    await loanService.refreshOverdueLoans(userId);

    const buckets = buildMonthBuckets(months);
    const startMonth = Object.keys(buckets)[0];
    const [year, month] = startMonth.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);

    const [loans, payments] = await Promise.all([
      LoanModel.aggregate([
        { $match: { userId: toObjectId(userId), issueDate: { $gte: startDate } } },
        {
          $group: {
            _id: {
              month: { $dateToString: { format: "%Y-%m", date: "$issueDate" } },
              type: "$type",
            },
            total: { $sum: "$amount" },
          },
        },
      ]),
      PaymentModel.aggregate([
        { $match: { userId: toObjectId(userId), paymentDate: { $gte: startDate } } },
        {
          $group: {
            _id: {
              month: { $dateToString: { format: "%Y-%m", date: "$paymentDate" } },
              type: "$type",
            },
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    for (const item of loans) {
      if (!buckets[item._id.month]) continue;
      if (item._id.type === LoanType.GIVEN) buckets[item._id.month].given = item.total;
      if (item._id.type === LoanType.TAKEN) buckets[item._id.month].taken = item.total;
    }

    for (const item of payments) {
      if (!buckets[item._id.month]) continue;
      if (item._id.type === PaymentType.RECEIVED) buckets[item._id.month].received = item.total;
      if (item._id.type === PaymentType.PAID) buckets[item._id.month].paid = item.total;
    }

    return Object.values(buckets);
  },

  async getLoanTypeChart(userId: string) {
    await loanService.refreshOverdueLoans(userId);

    return LoanModel.aggregate([
      { $match: { userId: toObjectId(userId) } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
          remainingAmount: { $sum: "$remainingAmount" },
        },
      },
      { $project: { _id: 0, type: "$_id", count: 1, amount: 1, remainingAmount: 1 } },
      { $sort: { type: 1 } },
    ]);
  },

  async getLoanStatusChart(userId: string) {
    await loanService.refreshOverdueLoans(userId);

    return LoanModel.aggregate([
      { $match: { userId: toObjectId(userId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
          remainingAmount: { $sum: "$remainingAmount" },
        },
      },
      { $project: { _id: 0, status: "$_id", count: 1, amount: 1, remainingAmount: 1 } },
      { $sort: { status: 1 } },
    ]);
  },

  async getTopContacts(userId: string, limit = 5) {
    await loanService.refreshOverdueLoans(userId);

    return LoanModel.aggregate([
      { $match: { userId: toObjectId(userId) } },
      {
        $group: {
          _id: "$contactId",
          totalAmount: { $sum: "$amount" },
          paidAmount: { $sum: "$paidAmount" },
          remainingAmount: { $sum: "$remainingAmount" },
          netReceivable: {
            $sum: { $cond: [{ $eq: ["$type", LoanType.GIVEN] }, "$remainingAmount", 0] },
          },
          netPayable: {
            $sum: { $cond: [{ $eq: ["$type", LoanType.TAKEN] }, "$remainingAmount", 0] },
          },
          loanCount: { $sum: 1 },
        },
      },
      { $sort: { remainingAmount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "contacts",
          localField: "_id",
          foreignField: "_id",
          as: "contact",
        },
      },
      { $unwind: { path: "$contact", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          contactId: "$_id",
          contactName: { $ifNull: ["$contact.name", "Deleted contact"] },
          phone: "$contact.phone",
          totalAmount: 1,
          paidAmount: 1,
          remainingAmount: 1,
          netReceivable: 1,
          netPayable: 1,
          overallBalance: { $subtract: ["$netReceivable", "$netPayable"] },
          loanCount: 1,
        },
      },
    ]);
  },
};
