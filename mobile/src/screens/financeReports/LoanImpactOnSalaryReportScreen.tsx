import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, WalletCards } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { MoneySummaryCard } from "../../components/MoneySummaryCard";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { formatCurrency } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

export const LoanImpactOnSalaryReportScreen = () => {
  const reportQuery = useQuery({ queryKey: ["reports", "loan-impact-on-salary"], queryFn: api.getLoanImpactOnSalaryReport });
  if (reportQuery.isLoading) return <Screen><LoadingState label="Loading loan impact..." /></Screen>;
  if (reportQuery.isError) return <Screen><ErrorState message="Loan impact report load nahi ho saka." onRetry={reportQuery.refetch} /></Screen>;
  const report = reportQuery.data!;
  return (
    <Screen className="gap-5 pt-5">
      <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Loan Impact</Text>
      <View className="flex-row gap-3">
        <MoneySummaryCard title="Repayments" value={formatCurrency(report.loanRepayments)} icon={WalletCards} tone="warning" />
        <MoneySummaryCard title="Recovery" value={formatCurrency(report.loanRecovery)} icon={ArrowDownLeft} tone="success" />
      </View>
      <MoneySummaryCard title="Net Loan Cash Flow" value={formatCurrency(report.netLoanCashFlow)} icon={WalletCards} />
      <View className="rounded-3xl border border-border bg-card p-5">
        <Text className="text-base font-black text-dark">Repayment Percent of Salary</Text>
        <View className="mt-4"><ProgressBar progress={Math.min(100, report.repaymentPercentOfSalary)} /></View>
        <Text className="mt-2 text-sm font-bold text-muted">{Math.round(report.repaymentPercentOfSalary)}%</Text>
      </View>
    </Screen>
  );
};
