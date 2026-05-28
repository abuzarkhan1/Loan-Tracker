import { ArrowDownLeft, ArrowUpRight, BarChart3, CheckCircle2, Plus, ReceiptText, Scale } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../utils/cn";

export type ScreenId = "dashboard" | "loans" | "detail" | "payment" | "reports";

const MiniCard = ({ label, value, tone = "primary" }: { label: string; value: string; tone?: "primary" | "success" | "warning" | "danger" }) => {
  const toneClass = {
    primary: "bg-background-soft text-primary",
    success: "bg-mint text-success",
    warning: "bg-yellow text-warning",
    danger: "bg-peach text-primary-dark",
  }[tone];

  return (
    <div className="rounded-[22px] border border-border bg-card p-3 shadow-soft">
      <div className={cn("mb-3 grid size-9 place-items-center rounded-[12px]", toneClass)}>
        {tone === "success" ? <ArrowDownLeft size={15} /> : tone === "danger" ? <ArrowUpRight size={15} /> : <ReceiptText size={15} />}
      </div>
      <p className="text-[9px] font-extrabold uppercase text-muted">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-dark">{value}</p>
    </div>
  );
};

const Progress = ({ value }: { value: number }) => (
  <div className="h-2 overflow-hidden rounded-full bg-background-soft">
    <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
  </div>
);

const PhoneShell = ({ children, compact = false }: { children: ReactNode; compact?: boolean }) => (
  <div
    className={cn(
      "phone-shadow relative mx-auto w-full max-w-[280px] rounded-[36px] border border-border bg-[#2b2631] p-2.5 sm:max-w-[292px] sm:rounded-[40px] sm:p-3",
      compact && "max-w-[218px] rounded-[32px] sm:max-w-[226px] sm:rounded-[34px]",
    )}
  >
    <div
      className={cn(
        "h-[500px] overflow-hidden rounded-[28px] bg-app-gradient px-3.5 pb-5 pt-5 text-dark sm:h-[540px] sm:rounded-[32px] sm:px-4",
        compact && "h-[410px] rounded-[26px] px-3 sm:h-[438px] sm:rounded-[28px]",
      )}
    >
      <div className={cn("mx-auto mb-5 h-1.5 w-16 rounded-full bg-[#2b2631]", compact && "mb-4 w-12")} />
      {children}
    </div>
  </div>
);

const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
    <div>
      <p className="text-lg font-extrabold text-dark sm:text-xl">{title}</p>
      <p className="mt-1 text-[11px] font-bold text-muted">{subtitle}</p>
    </div>
    <button type="button" aria-label="Add" className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-white shadow-primary-glow sm:size-11">
      <Plus size={18} />
    </button>
  </div>
);

const DashboardScreen = () => (
  <>
    <Header title="Dashboard" subtitle="Aaj ki complete loan picture." />
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
      <MiniCard label="Mujhe Lene Hain" value="Rs 84k" tone="success" />
      <MiniCard label="Mujhe Dene Hain" value="Rs 36k" tone="danger" />
      <MiniCard label="Total Wapis Mila" value="Rs 51k" tone="primary" />
      <MiniCard label="Baqi Raqam" value="Rs 47k" tone="warning" />
    </div>
    <div className="mt-3 rounded-[22px] border border-border bg-card p-3.5 shadow-soft sm:mt-4 sm:rounded-[24px] sm:p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-extrabold text-dark">Monthly Flow</p>
        <p className="text-[10px] font-bold text-muted">6 months</p>
      </div>
      <div className="flex h-24 items-end gap-2.5 sm:h-28 sm:gap-3">
        {[42, 68, 52, 78, 61, 88].map((height, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <div className="w-full rounded-full bg-peach">
              <div className="rounded-full bg-primary" style={{ height }} />
            </div>
            <span className="text-[9px] font-bold text-muted">{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  </>
);

const LoansScreen = () => (
  <>
    <Header title="Loans" subtitle="Given aur taken dono track karein." />
    <div className="grid gap-3">
      {[
        ["Ahmed Khan", "Mujhe Lene Hain", "Rs 20,000", 64, "success"],
        ["Bilal", "Mujhe Dene Hain", "Rs 12,500", 35, "danger"],
        ["Sara", "Partial", "Rs 8,000", 82, "warning"],
      ].map(([name, badge, amount, progress, tone]) => (
        <div key={name} className="rounded-[24px] border border-border bg-card p-3.5 shadow-soft sm:rounded-[26px] sm:p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-extrabold text-dark">{name}</p>
              <p className="mt-1 text-[11px] font-bold text-muted">Due 12 Jun</p>
            </div>
            <span className={cn("rounded-full px-3 py-1 text-[10px] font-extrabold", tone === "success" ? "bg-mint text-success" : tone === "danger" ? "bg-peach text-primary-dark" : "bg-yellow text-warning")}>
              {badge}
            </span>
          </div>
          <div className="mb-2 flex items-center justify-between text-[10px] font-extrabold text-muted">
            <span>Paid {progress}%</span>
            <span>{amount}</span>
          </div>
          <Progress value={Number(progress)} />
        </div>
      ))}
    </div>
  </>
);

const DetailScreen = () => (
  <>
    <Header title="Loan Detail" subtitle="Payment History" />
    <div className="rounded-[26px] border border-border bg-card p-4 shadow-soft sm:rounded-[28px] sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-extrabold text-dark">Rs 20,000</p>
          <p className="mt-1 text-xs font-bold text-muted">Ahmed Khan</p>
        </div>
        <span className="rounded-full bg-yellow px-3 py-1 text-[10px] font-extrabold text-warning">Partial</span>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-[11px] font-extrabold text-muted">
          <span>Paid 65%</span>
          <span>Baqi Rs 7,000</span>
        </div>
        <Progress value={65} />
      </div>
    </div>
    <div className="mt-4 grid gap-3">
      {[
        ["Rs 5,000", "Cash", "Today, 8:30 PM"],
        ["Rs 4,000", "Bank", "18 May, 3:10 PM"],
        ["Rs 4,000", "EasyPaisa", "10 May, 12:20 PM"],
      ].map(([amount, method, date]) => (
        <div key={`${amount}-${date}`} className="flex items-center justify-between rounded-[20px] border border-border bg-card p-3.5 shadow-soft sm:rounded-[22px] sm:p-4">
          <div>
            <p className="font-extrabold text-dark">{amount}</p>
            <p className="mt-1 text-[11px] font-bold text-muted">{method}</p>
          </div>
          <p className="text-right text-[10px] font-bold text-muted">{date}</p>
        </div>
      ))}
    </div>
  </>
);

const PaymentScreen = () => (
  <>
    <Header title="Nayi Payment" subtitle="Partial repayment save karein." />
    <div className="rounded-[26px] border border-border bg-card p-4 shadow-soft sm:rounded-[28px] sm:p-5">
      <label className="text-xs font-extrabold uppercase text-muted">Amount</label>
      <div className="mt-2 rounded-full border border-border bg-input px-5 py-4 text-lg font-extrabold text-dark">Rs 5,000</div>
      <label className="mt-5 block text-xs font-extrabold uppercase text-muted">Method</label>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {["Cash", "Bank", "JazzCash", "Other"].map((method, index) => (
          <span key={method} className={cn("rounded-full border px-4 py-3 text-center text-xs font-extrabold", index === 0 ? "border-primary bg-primary text-white" : "border-border bg-background-soft text-muted")}>
            {method}
          </span>
        ))}
      </div>
      <label className="mt-5 block text-xs font-extrabold uppercase text-muted">Payment Date</label>
      <div className="mt-2 rounded-full border border-border bg-input px-5 py-4 text-sm font-extrabold text-dark">May 28, 2026</div>
      <button type="button" className="mt-6 min-h-12 w-full rounded-full bg-primary text-sm font-extrabold text-white shadow-primary-glow">
        Save Payment
      </button>
    </div>
  </>
);

const ReportsScreen = () => (
  <>
    <Header title="Reports" subtitle="Charts se trends samjhein." />
    <div className="grid gap-3">
      <div className="rounded-[24px] border border-border bg-card p-3.5 shadow-soft sm:rounded-[26px] sm:p-4">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="text-primary" size={18} />
          <p className="text-sm font-extrabold text-dark">Loan Type Chart</p>
        </div>
        <div className="flex items-end gap-4">
          <div className="h-24 flex-1 rounded-t-[18px] bg-mint" />
          <div className="h-16 flex-1 rounded-t-[18px] bg-peach" />
          <div className="h-20 flex-1 rounded-t-[18px] bg-yellow" />
        </div>
      </div>
      <div className="rounded-[24px] border border-border bg-card p-3.5 shadow-soft sm:rounded-[26px] sm:p-4">
        <p className="text-sm font-extrabold text-dark">Status Split</p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {([
            ["12", "Active", Scale],
            ["18", "Done", CheckCircle2],
            ["3", "Overdue", ReceiptText],
          ] satisfies [string, string, LucideIcon][]).map(([value, label, Icon]) => (
            <div key={label} className="rounded-[20px] bg-background-soft p-3 text-center">
              <Icon className="mx-auto text-primary" size={17} />
              <p className="mt-2 text-lg font-extrabold text-dark">{value}</p>
              <p className="text-[10px] font-bold text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

const screenMap: Record<ScreenId, ReactElement> = {
  dashboard: <DashboardScreen />,
  loans: <LoansScreen />,
  detail: <DetailScreen />,
  payment: <PaymentScreen />,
  reports: <ReportsScreen />,
};

export const PhoneMockup = ({ screen = "dashboard", compact = false, className }: { screen?: ScreenId; compact?: boolean; className?: string }) => (
  <div className={className}>
    <PhoneShell compact={compact}>{screenMap[screen]}</PhoneShell>
  </div>
);
