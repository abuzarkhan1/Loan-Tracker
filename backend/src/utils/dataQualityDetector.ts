import { Types } from "mongoose";
import { LoanStatus } from "../constants/enums";
import { BillModel } from "../modules/bills/bill.model";
import { ContactModel } from "../modules/contacts/contact.model";
import { LoanModel } from "../modules/loans/loan.model";
import { PromiseModel } from "../modules/promises/promise.model";
import { SmartEntryModel } from "../modules/smartEntry/smart-entry.model";
import { TransactionModel } from "../modules/transactions/transaction.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

export const detectDataQualityIssues = async (userId: string) => {
  const user = toObjectId(userId);
  const [
    loansMissingDueDate,
    contactsMissingPhone,
    uncategorizedExpenses,
    billsWithoutReminders,
    unsettledCompletedLoans,
    transactionsMissingMethod,
    oldPromises,
    duplicatePhones,
    duplicateNames,
    unconfirmedSmartEntries,
  ] = await Promise.all([
    LoanModel.find({ userId: user, dueDate: { $exists: false }, status: { $ne: LoanStatus.COMPLETED } }).limit(10),
    ContactModel.find({ userId: user, $or: [{ phone: { $exists: false } }, { phone: "" }] }).limit(10),
    TransactionModel.find({ userId: user, type: "EXPENSE", categoryId: { $exists: false } }).limit(10),
    BillModel.find({ userId: user, reminderEnabled: false, status: "ACTIVE" }).limit(10),
    LoanModel.find({ userId: user, status: LoanStatus.COMPLETED, remainingAmount: 0 }).limit(10),
    TransactionModel.find({ userId: user, paymentMethod: { $exists: false } }).limit(10),
    PromiseModel.find({ userId: user, status: "PENDING", promiseDate: { $lt: new Date(Date.now() - 7 * 86_400_000) } }).limit(10),
    ContactModel.aggregate([
      { $match: { userId: user, normalizedPhone: { $exists: true, $nin: [null, ""] } } },
      { $group: { _id: "$normalizedPhone", ids: { $push: "$_id" }, names: { $push: "$name" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $limit: 10 },
    ]),
    ContactModel.aggregate([
      { $match: { userId: user } },
      { $project: { name: 1, normalizedName: { $toLower: "$name" } } },
      { $group: { _id: "$normalizedName", ids: { $push: "$_id" }, names: { $push: "$name" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $limit: 10 },
    ]),
    SmartEntryModel.find({ userId: user, status: "PARSED", createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }).limit(10),
  ]);

  return [
    ...loansMissingDueDate.map((loan) => ({ id: `loan-due-${loan._id}`, type: "LOAN_MISSING_DUE_DATE", title: "Loan missing due date", description: "Add a due date so reminders and forecast stay accurate.", severity: "WARNING", entityType: "LOAN", entityId: loan._id.toString(), actionLabel: "Edit loan", actionRoute: "LoanForm" })),
    ...contactsMissingPhone.map((contact) => ({ id: `contact-phone-${contact._id}`, type: "CONTACT_MISSING_PHONE", title: "Contact missing phone", description: `${contact.name} does not have a phone number.`, severity: "INFO", entityType: "CONTACT", entityId: contact._id.toString(), actionLabel: "Edit contact", actionRoute: "ContactForm" })),
    ...uncategorizedExpenses.map((transaction) => ({ id: `expense-category-${transaction._id}`, type: "EXPENSE_WITHOUT_CATEGORY", title: "Expense without category", description: "Categorize this expense for better reports.", severity: "INFO", entityType: "TRANSACTION", entityId: transaction._id.toString(), actionLabel: "Edit transaction", actionRoute: "AddTransaction" })),
    ...billsWithoutReminders.map((bill) => ({ id: `bill-reminder-${bill._id}`, type: "BILL_WITHOUT_REMINDER", title: "Bill reminder disabled", description: `${bill.title} has no reminder enabled.`, severity: "INFO", entityType: "BILL", entityId: bill._id.toString(), actionLabel: "Edit bill", actionRoute: "AddEditBill" })),
    ...unsettledCompletedLoans.map((loan) => ({ id: `loan-settlement-${loan._id}`, type: "COMPLETED_LOAN_NOT_SETTLED", title: "Completed loan may need settlement", description: "Settle completed loans to close the record cleanly.", severity: "INFO", entityType: "LOAN", entityId: loan._id.toString(), actionLabel: "Settle loan", actionRoute: "SettlementConfirmation" })),
    ...transactionsMissingMethod.map((transaction) => ({ id: `transaction-method-${transaction._id}`, type: "TRANSACTION_MISSING_PAYMENT_METHOD", title: "Payment method missing", description: "Add payment method for cash-flow method reports.", severity: "WARNING", entityType: "TRANSACTION", entityId: transaction._id.toString(), actionLabel: "Edit transaction", actionRoute: "AddTransaction" })),
    ...oldPromises.map((promise) => ({ id: `promise-old-${promise._id}`, type: "OLD_PENDING_PROMISE", title: "Old pending promise", description: "Review this promise and mark it kept, broken, or cancelled.", severity: "WARNING", entityType: "PROMISE", entityId: promise._id.toString(), actionLabel: "Open promises", actionRoute: "Promises" })),
    ...duplicatePhones.map((group) => ({ id: `duplicate-phone-${group._id}`, type: "DUPLICATE_CONTACT_PHONE", title: "Possible duplicate contacts", description: `${group.count} contacts share the same phone number.`, severity: "WARNING", entityType: "CONTACT", entityId: String(group.ids[0]), actionLabel: "Review contacts", actionRoute: "Contacts" })),
    ...duplicateNames.map((group) => ({ id: `duplicate-name-${group._id}`, type: "DUPLICATE_CONTACT_NAME", title: "Possible duplicate contact names", description: `${group.count} contacts have the name ${group.names[0]}.`, severity: "INFO", entityType: "CONTACT", entityId: String(group.ids[0]), actionLabel: "Review contacts", actionRoute: "Contacts" })),
    ...unconfirmedSmartEntries.map((entry) => ({ id: `smart-entry-unconfirmed-${entry._id}`, type: "UNCONFIRMED_SMART_ENTRY", title: "Unconfirmed smart entry", description: "This parsed smart entry was never confirmed or cancelled.", severity: "INFO", entityType: "SMART_ENTRY", entityId: entry._id.toString(), actionLabel: "Open smart history", actionRoute: "SmartEntryHistory" })),
  ];
};
