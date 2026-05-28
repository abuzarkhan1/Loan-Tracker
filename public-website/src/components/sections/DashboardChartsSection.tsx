import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { financeCards } from "../../content/site.content";
import { Card } from "../common/Card";
import { IconBadge, type Tone } from "../common/IconBadge";
import { Section } from "../common/Section";
import { SectionHeader } from "../common/SectionHeader";

const chartData = [
  { month: "Jan", loans: 42, payments: 24 },
  { month: "Feb", loans: 58, payments: 31 },
  { month: "Mar", loans: 49, payments: 42 },
  { month: "Apr", loans: 72, payments: 48 },
  { month: "May", loans: 64, payments: 55 },
  { month: "Jun", loans: 84, payments: 68 },
];

export const DashboardChartsSection = () => (
  <Section id="dashboard">
    <SectionHeader
      eyebrow="Dashboard and charts"
      title="The complete money picture, summarized without confusion."
      description="Roman Urdu friendly labels make the dashboard easy for local users while keeping the design polished."
    />

    <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="grid gap-3 sm:grid-cols-2">
        {financeCards.map((card) => (
          <Card key={card.label} className="p-5">
            <IconBadge icon={card.icon} tone={card.tone as Tone} />
            <p className="mt-4 text-[11px] font-extrabold uppercase text-muted">{card.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-dark">{card.value}</p>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl p-5 sm:p-7">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-extrabold text-dark">Monthly Flow</h3>
            <p className="mt-1 text-sm font-bold text-muted">Loans and repayments trend</p>
          </div>
          <span className="w-fit rounded-full bg-peach px-4 py-2 text-xs font-extrabold uppercase text-primary-dark">Sample report</span>
        </div>
        <div className="h-[260px] sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: -22, right: 8, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="loans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(var(--color-primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="rgb(var(--color-primary))" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="payments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(var(--color-success))" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="rgb(var(--color-success))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgb(var(--color-border))" strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "rgb(var(--color-muted))", fontSize: 12, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgb(var(--color-muted))", fontSize: 12, fontWeight: 700 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 18,
                  borderColor: "rgb(var(--color-border))",
                  background: "rgb(var(--color-card))",
                  color: "rgb(var(--color-text))",
                  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.28)",
                }}
              />
              <Area type="monotone" dataKey="loans" stroke="rgb(var(--color-primary))" strokeWidth={3} fill="url(#loans)" />
              <Area type="monotone" dataKey="payments" stroke="rgb(var(--color-success))" strokeWidth={3} fill="url(#payments)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  </Section>
);
