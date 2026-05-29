import { Types } from "mongoose";
import { buildPaginationMeta } from "../../utils/pagination";
import { EmailLogModel } from "../email/email.model";
import { FollowUpModel } from "../followUps/follow-up.model";
import { PaymentRequestModel } from "../paymentRequests/payment-request.model";
import { PromiseModel } from "../promises/promise.model";
import { ReceiptModel } from "../receipts/receipt.model";
import { SettlementModel } from "../settlements/settlement.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

export const communicationService = {
  async getContactTimeline(
    userId: string,
    contactId: string,
    filters: { type?: string; channel?: string; dateFrom?: Date; dateTo?: Date; page: number; limit: number },
  ) {
    const dateFilter = (field = "createdAt") => ({
      ...(filters.dateFrom || filters.dateTo ? { [field]: { ...(filters.dateFrom ? { $gte: filters.dateFrom } : {}), ...(filters.dateTo ? { $lte: filters.dateTo } : {}) } } : {}),
    });
    const base = { userId: toObjectId(userId), contactId: toObjectId(contactId) };
    const [emails, followUps, paymentRequests, promises, receipts, settlements] = await Promise.all([
      EmailLogModel.find({ ...base, ...dateFilter() }).lean(),
      FollowUpModel.find({ ...base, ...dateFilter() }).lean(),
      PaymentRequestModel.find({ ...base, ...dateFilter() }).lean(),
      PromiseModel.find({ ...base, ...dateFilter() }).lean(),
      ReceiptModel.find({ ...base, ...dateFilter() }).lean(),
      SettlementModel.find({ ...base, ...dateFilter() }).lean(),
    ]);

    const items = [
      ...emails.map((item) => ({
        id: item._id.toString(),
        type: item.type,
        channel: "EMAIL",
        title: item.subject,
        description: item.toEmail,
        status: item.status,
        relatedLoanId: item.loanId?.toString(),
        relatedPaymentId: item.paymentId?.toString(),
        createdAt: item.createdAt,
      })),
      ...followUps.map((item) => ({
        id: item._id.toString(),
        type: item.type,
        channel: item.channel,
        title: `${item.channel} follow-up`,
        description: item.note || item.message || item.status,
        status: item.status,
        relatedLoanId: item.loanId?.toString(),
        createdAt: item.createdAt,
      })),
      ...paymentRequests.map((item) => ({
        id: item._id.toString(),
        type: "PAYMENT_REQUEST",
        channel: "SHARE",
        title: item.requestNumber,
        description: item.message,
        status: item.status,
        relatedLoanId: item.loanId.toString(),
        createdAt: item.createdAt,
      })),
      ...promises.map((item) => ({
        id: item._id.toString(),
        type: "PROMISE",
        channel: "IN_APP",
        title: `Promise ${item.status}`,
        description: `Rs ${item.promisedAmount.toLocaleString("en-PK")} on ${item.promiseDate.toLocaleDateString("en-PK")}`,
        status: item.status,
        relatedLoanId: item.loanId.toString(),
        createdAt: item.createdAt,
      })),
      ...receipts.map((item) => ({
        id: item._id.toString(),
        type: "RECEIPT",
        channel: "PDF",
        title: item.title,
        description: item.receiptNumber,
        status: item.status,
        relatedLoanId: item.loanId?.toString(),
        relatedPaymentId: item.paymentId?.toString(),
        createdAt: item.createdAt,
      })),
      ...settlements.map((item) => ({
        id: item._id.toString(),
        type: "SETTLEMENT",
        channel: "IN_APP",
        title: item.settlementNumber,
        description: item.status,
        status: item.status,
        relatedLoanId: item.loanId.toString(),
        createdAt: item.createdAt,
      })),
    ]
      .filter((item) => !filters.type || item.type === filters.type)
      .filter((item) => !filters.channel || item.channel === filters.channel)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const limit = Math.min(filters.limit, 100);
    const start = (filters.page - 1) * limit;
    return {
      items: items.slice(start, start + limit),
      pagination: buildPaginationMeta(filters.page, limit, items.length),
    };
  },
};
