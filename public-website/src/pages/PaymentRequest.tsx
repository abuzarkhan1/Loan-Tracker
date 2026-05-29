import { useEffect, useState } from "react";
import { AlertCircle, CalendarClock, CheckCircle2, CreditCard, ReceiptText } from "lucide-react";
import { useParams } from "react-router-dom";
import { Card } from "../components/common/Card";
import { SEO } from "../components/common/SEO";
import { Section } from "../components/common/Section";
import { APP_CONFIG } from "../config/app.config";

type PublicPaymentRequest = {
  requestNumber: string;
  contactName: string;
  amountRequested: number;
  remainingAmount: number;
  dueDate?: string;
  message: string;
  status: string;
  expiresAt?: string;
  appName: string;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date?: string) => date ? new Intl.DateTimeFormat("en-PK", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date)) : "Not set";

export const PaymentRequest = () => {
  const { token } = useParams();
  const [request, setRequest] = useState<PublicPaymentRequest | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const loadRequest = async () => {
      try {
        const response = await fetch(`${APP_CONFIG.apiBaseUrl}/public/payment-request/${token}`);
        if (!response.ok) throw new Error("Payment request not found");
        const json = await response.json() as { data: PublicPaymentRequest };
        setRequest(json.data);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    };

    void loadRequest();
  }, [token]);

  return (
    <>
      <SEO
        title="Payment Request"
        description="View a secure Loan Tracker payment request summary."
      />
      <Section className="min-h-[70vh] pt-10 lg:pt-16">
        <div className="mx-auto max-w-3xl">
          {status === "loading" ? (
            <Card className="rounded-2xl p-8 text-center">
              <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-peach" />
              <h1 className="mt-5 text-2xl font-extrabold text-dark">Loading request</h1>
              <p className="mt-3 text-sm font-medium leading-7 text-muted">Secure summary tayyar ho rahi hai.</p>
            </Card>
          ) : null}

          {status === "error" ? (
            <Card className="rounded-2xl p-8 text-center">
              <AlertCircle className="mx-auto text-primary" size={34} />
              <h1 className="mt-5 text-2xl font-extrabold text-dark">Request unavailable</h1>
              <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-muted">
                This payment request is expired, cancelled, or no longer available. Please contact the sender for an updated summary.
              </p>
            </Card>
          ) : null}

          {status === "ready" && request ? (
            <Card className="overflow-hidden rounded-2xl p-0">
              <div className="border-b border-border bg-background-soft p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase text-primary">{request.requestNumber}</p>
                    <h1 className="mt-3 text-3xl font-extrabold leading-tight text-dark sm:text-4xl">Payment Request</h1>
                    <p className="mt-3 text-sm font-semibold text-muted">From {request.appName || APP_CONFIG.appName}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
                    <CheckCircle2 className="text-success" size={16} />
                    <span className="text-xs font-extrabold uppercase text-dark">{request.status}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
                <div className="rounded-2xl border border-border bg-background-soft p-5">
                  <CreditCard className="text-primary" size={24} />
                  <p className="mt-4 text-xs font-extrabold uppercase text-muted">Amount Requested</p>
                  <p className="mt-2 text-3xl font-extrabold text-primary">{formatCurrency(request.amountRequested)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background-soft p-5">
                  <ReceiptText className="text-success" size={24} />
                  <p className="mt-4 text-xs font-extrabold uppercase text-muted">Remaining Amount</p>
                  <p className="mt-2 text-3xl font-extrabold text-dark">{formatCurrency(request.remainingAmount)}</p>
                </div>
              </div>

              <div className="space-y-4 px-6 pb-8 sm:px-8">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs font-extrabold uppercase text-muted">Contact</p>
                  <p className="mt-2 text-xl font-extrabold text-dark">{request.contactName}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="text-primary" size={18} />
                    <p className="text-xs font-extrabold uppercase text-muted">Due Date</p>
                  </div>
                  <p className="mt-2 text-base font-bold text-dark">{formatDate(request.dueDate)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background-soft p-5">
                  <p className="text-xs font-extrabold uppercase text-muted">Message</p>
                  <p className="mt-3 text-sm font-medium leading-7 text-muted">{request.message}</p>
                </div>
                <p className="text-center text-xs font-semibold leading-6 text-muted">
                  This public page shows only the requested amount summary. Full loan history stays private inside Loan Tracker.
                </p>
              </div>
            </Card>
          ) : null}
        </div>
      </Section>
    </>
  );
};
