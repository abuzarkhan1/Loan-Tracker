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

  async getInsights(userId: string) {
    await loanService.refreshOverdueLoans(userId);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const dueSoonEnd = new Date(now);
    dueSoonEnd.setDate(now.getDate() + 7);
    dueSoonEnd.setHours(23, 59, 59, 999);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const [summary, overdueLoans, dueSoonLoans, monthlyPayments, topPending, completedCount, loanCount] = await Promise.all([
      this.getSummary(userId),
      LoanModel.find({ userId, remainingAmount: { $gt: 0 }, status: LoanStatus.OVERDUE })
        .populate("contactId", "name")
        .sort({ dueDate: 1 })
        .limit(3),
      LoanModel.find({ userId, remainingAmount: { $gt: 0 }, dueDate: { $gte: today, $lte: dueSoonEnd } })
        .populate("contactId", "name")
        .sort({ dueDate: 1 })
        .limit(3),
      PaymentModel.aggregate([
        { $match: { userId: toObjectId(userId), paymentDate: { $gte: monthStart } } },
        { $group: { _id: "$type", total: { $sum: "$amount" } } },
      ]),
      this.getTopContacts(userId, 1),
      LoanModel.countDocuments({ userId, status: LoanStatus.COMPLETED }),
      LoanModel.countDocuments({ userId }),
    ]);

    const insights: Array<{
      id: string;
      type: "DUE_SOON" | "OVERDUE" | "MONTHLY_SUMMARY" | "NET_BALANCE" | "TOP_PENDING" | "RECOVERY_RATE" | "TRUST_ALERT";
      title: string;
      description: string;
      severity: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
      actionLabel?: string;
      actionRoute?: string;
      metadata?: Record<string, unknown>;
    }> = [];

    dueSoonLoans.forEach((loan) => {
      const contactName = loan.contactId && typeof loan.contactId === "object" && "name" in loan.contactId
        ? String((loan.contactId as { name?: string }).name || "Contact")
        : "Contact";
      const days = loan.dueDate ? Math.max(0, Math.ceil((loan.dueDate.getTime() - today.getTime()) / 86_400_000)) : 0;
      insights.push({
        id: `due-soon-${loan._id.toString()}`,
        type: "DUE_SOON",
        title: `${contactName} ka loan ${days} din baad due hai.`,
        description: `Baqi raqam Rs ${loan.remainingAmount.toLocaleString("en-PK")} hai.`,
        severity: "WARNING",
        actionLabel: "Open loan",
        actionRoute: "LoanDetail",
        metadata: { loanId: loan._id.toString(), contactId: loan.contactId?.toString(), dueDate: loan.dueDate },
      });
    });

    if (overdueLoans.length) {
      const total = overdueLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
      insights.push({
        id: "overdue-summary",
        type: "OVERDUE",
        title: `${overdueLoans.length} loans overdue hain.`,
        description: `Overdue amount Rs ${total.toLocaleString("en-PK")} hai. Reminder bhejna useful ho sakta hai.`,
        severity: "DANGER",
        actionLabel: "View overdue",
        actionRoute: "OverdueReport",
        metadata: { count: overdueLoans.length, amount: total },
      });
    }

    const receivedThisMonth = monthlyPayments
      .filter((payment) => payment._id === PaymentType.RECEIVED)
      .reduce((sum, payment) => sum + payment.total, 0);
    const paidThisMonth = monthlyPayments
      .filter((payment) => payment._id === PaymentType.PAID)
      .reduce((sum, payment) => sum + payment.total, 0);

    insights.push({
      id: "monthly-summary",
      type: "MONTHLY_SUMMARY",
      title: `Is month Rs ${receivedThisMonth.toLocaleString("en-PK")} wapis mila.`,
      description: `Aur Rs ${paidThisMonth.toLocaleString("en-PK")} wapis diya gaya.`,
      severity: receivedThisMonth >= paidThisMonth ? "SUCCESS" : "INFO",
      actionLabel: "Monthly report",
      actionRoute: "MonthlyReportDetail",
      metadata: { receivedThisMonth, paidThisMonth, month: now.getMonth() + 1, year: now.getFullYear() },
    });

    insights.push({
      id: "net-balance",
      type: "NET_BALANCE",
      title: summary.overallBalance >= 0 ? "Aapka net balance positive hai." : "Aapka net balance payable side par hai.",
      description: `Overall balance Rs ${summary.overallBalance.toLocaleString("en-PK")} hai.`,
      severity: summary.overallBalance >= 0 ? "SUCCESS" : "WARNING",
      metadata: { overallBalance: summary.overallBalance },
    });

    if (topPending[0]) {
      insights.push({
        id: `top-pending-${topPending[0].contactId}`,
        type: "TOP_PENDING",
        title: `${topPending[0].contactName} ke paas sabse zyada pending amount hai.`,
        description: `Pending Rs ${topPending[0].remainingAmount.toLocaleString("en-PK")} hai.`,
        severity: "INFO",
        actionLabel: "Open profile",
        actionRoute: "ContactLoanProfile",
        metadata: { contactId: topPending[0].contactId, remainingAmount: topPending[0].remainingAmount },
      });
    }

    const recoveryRate = loanCount > 0 ? Math.round((completedCount / loanCount) * 100) : 0;
    insights.push({
      id: "recovery-rate",
      type: "RECOVERY_RATE",
      title: `Aapki recovery rate ${recoveryRate}% hai.`,
      description: `${completedCount} of ${loanCount} loans completed hain.`,
      severity: recoveryRate >= 70 ? "SUCCESS" : recoveryRate >= 40 ? "INFO" : "WARNING",
      actionLabel: "Reports",
      actionRoute: "Reports",
      metadata: { recoveryRate, completedCount, loanCount },
    });

    return insights.slice(0, 8);
  },
};
