import { Types } from "mongoose";
import { LoanStatus, LoanType } from "../../constants/enums";
import { LoanModel } from "../loans/loan.model";
import { PaymentModel } from "../payments/payment.model";
import { FollowUpModel } from "../followUps/follow-up.model";
import { PromiseModel } from "../promises/promise.model";

const toObjectId = (id: string) => new Types.ObjectId(id);
const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const contactName = (value: unknown) =>
  value && typeof value === "object" && "name" in value ? String((value as { name?: string }).name || "Contact") : "Contact";
const phone = (value: unknown) =>
  value && typeof value === "object" && "phone" in value ? String((value as { phone?: string }).phone || "") : "";

const loanItem = async (userId: string, loan: any, type: string, severity: string) => {
  const lastFollowUp = await FollowUpModel.findOne({ userId, loanId: loan._id }).sort({ createdAt: -1 });
  const overdueDays = loan.dueDate && loan.dueDate.getTime() < Date.now() ? Math.floor((Date.now() - loan.dueDate.getTime()) / 86_400_000) : 0;
  return {
    id: `${type}-${loan._id.toString()}`,
    type,
    contactId: loan.contactId?._id?.toString?.() || loan.contactId?.toString?.(),
    loanId: loan._id.toString(),
    contactName: contactName(loan.contactId),
    phone: phone(loan.contactId),
    amount: loan.amount,
    remainingAmount: loan.remainingAmount,
    dueDate: loan.dueDate,
    overdueDays,
    lastFollowUpAt: lastFollowUp?.createdAt,
    nextSuggestedAction: overdueDays > 0 ? "Send reminder and ask for promise date" : "Send friendly due reminder",
    severity,
    actionButtons: ["WHATSAPP", "EMAIL", "COPY", "FOLLOW_UP", "ADD_PAYMENT", "ADD_PROMISE"],
  };
};

export const recoveryService = {
  async getCenter(userId: string) {
    const { start, end } = todayRange();
    const [todayDue, overdue, highPending, promiseDue, recentlyPaid] = await Promise.all([
      LoanModel.find({ userId, remainingAmount: { $gt: 0 }, dueDate: { $gte: start, $lte: end } }).populate("contactId", "name phone relationship").sort({ dueDate: 1 }).limit(20),
      LoanModel.find({ userId, remainingAmount: { $gt: 0 }, status: LoanStatus.OVERDUE }).populate("contactId", "name phone relationship").sort({ dueDate: 1 }).limit(20),
      LoanModel.aggregate([
        { $match: { userId: toObjectId(userId), remainingAmount: { $gt: 0 } } },
        { $group: { _id: "$contactId", remainingAmount: { $sum: "$remainingAmount" }, amount: { $sum: "$amount" }, loanCount: { $sum: 1 } } },
        { $sort: { remainingAmount: -1 } },
        { $limit: 10 },
        { $lookup: { from: "contacts", localField: "_id", foreignField: "_id", as: "contact" } },
        { $unwind: "$contact" },
      ]),
      PromiseModel.find({ userId, status: "PENDING", promiseDate: { $gte: start, $lte: end } }).populate("contactId", "name phone").populate("loanId", "remainingAmount amount dueDate").sort({ promiseDate: 1 }).limit(20),
      PaymentModel.find({ userId, paymentDate: { $gte: start } }).populate("contactId", "name phone").populate("loanId", "remainingAmount amount").sort({ paymentDate: -1 }).limit(10),
    ]);

    const todayDueLoans = await Promise.all(todayDue.map((loan) => loanItem(userId, loan, "TODAY_DUE", "WARNING")));
    const overdueLoans = await Promise.all(overdue.map((loan) => loanItem(userId, loan, "OVERDUE", "DANGER")));
    const reminderSuggested = overdueLoans.filter((item) => !item.lastFollowUpAt || Date.now() - new Date(item.lastFollowUpAt).getTime() > 2 * 86_400_000);
    const highPendingContacts = highPending.map((row) => ({
      id: `high-pending-${row._id.toString()}`,
      type: "HIGH_PENDING",
      contactId: row._id.toString(),
      contactName: row.contact?.name || "Contact",
      phone: row.contact?.phone,
      amount: row.amount,
      remainingAmount: row.remainingAmount,
      nextSuggestedAction: row.contact?.relationship?.preferredReminderChannel ? `Use ${row.contact.relationship.preferredReminderChannel}` : "Send reminder",
      severity: "INFO",
      actionButtons: ["WHATSAPP", "EMAIL", "VIEW_CONTACT"],
    }));
    const promiseDueItems = promiseDue.map((promise) => ({
      id: `promise-due-${promise._id.toString()}`,
      type: "PROMISE_DUE",
      contactId: promise.contactId?._id?.toString?.() || promise.contactId?.toString?.(),
      loanId: promise.loanId?._id?.toString?.() || promise.loanId?.toString?.(),
      contactName: contactName(promise.contactId),
      phone: phone(promise.contactId),
      amount: promise.promisedAmount,
      remainingAmount: (promise.loanId as any)?.remainingAmount || promise.promisedAmount,
      dueDate: promise.promiseDate,
      nextSuggestedAction: "Confirm promised payment",
      severity: "WARNING",
      actionButtons: ["WHATSAPP", "EMAIL", "MARK_FOLLOWED_UP", "ADD_PAYMENT"],
    }));
    const recentlyPaidItems = recentlyPaid.map((payment) => ({
      id: `recently-paid-${payment._id.toString()}`,
      type: "RECENTLY_PAID",
      contactId: payment.contactId?._id?.toString?.() || payment.contactId?.toString?.(),
      loanId: payment.loanId?._id?.toString?.() || payment.loanId?.toString?.(),
      contactName: contactName(payment.contactId),
      phone: phone(payment.contactId),
      amount: payment.amount,
      remainingAmount: (payment.loanId as any)?.remainingAmount || 0,
      dueDate: payment.paymentDate,
      nextSuggestedAction: "Send receipt or thanks",
      severity: "SUCCESS",
      actionButtons: ["RECEIPT", "WHATSAPP"],
    }));

    return {
      todayDueLoans,
      overdueLoans,
      highPendingContacts,
      reminderSuggested,
      promiseDue: promiseDueItems,
      recentlyPaid: recentlyPaidItems,
      noActionNeededSummary: {
        clear: todayDueLoans.length + overdueLoans.length + promiseDueItems.length === 0,
        message: "Everything is clear. No recovery action needed right now.",
      },
    };
  },
};
