import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Banknote, PiggyBank, WalletCards } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { MoneySummaryCard } from "../../components/MoneySummaryCard";
import { TransactionCard } from "../../components/TransactionCard";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { formatCurrency, formatDate } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

export const SalaryCycleDetailScreen = () => {
  const cycleQuery = useQuery({ queryKey: ["salary", "cycle-summary"], queryFn: () => api.getSalaryCycleSummary() });
  const transactionsQuery = useQuery({
    queryKey: ["transactions", "cycle", cycleQuery.data?.cycleStartDate, cycleQuery.data?.cycleEndDate],
    queryFn: () => api.getTransactions({ dateFrom: cycleQuery.data?.cycleStartDate, dateTo: cycleQuery.data?.cycleEndDate, limit: 50 }),
    enabled: Boolean(cycleQuery.data),
  });

  if (cycleQuery.isLoading) return <Screen><LoadingState label="Loading salary cycle..." /></Screen>;
  if (cycleQuery.isError) return <Screen><ErrorState message="Cycle summary load nahi ho saki." onRetry={cycleQuery.refetch} /></Screen>;

  const data = cycleQuery.data;
  if (!data) return null;

  return (
    <Screen className="gap-5 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Salary Cycle</Text>
        <Text className="mt-1 text-sm font-medium text-muted">{formatDate(data.cycleStartDate)} - {formatDate(data.cycleEndDate)}</Text>
      </View>
      <View className="flex-row gap-3">
        <MoneySummaryCard title="Salary" value={formatCurrency(data.salaryReceived)} icon={Banknote} tone="success" />
        <MoneySummaryCard title="Other Income" value={formatCurrency(data.otherIncome)} icon={ArrowDownLeft} tone="success" />
      </View>
      <View className="flex-row gap-3">
        <MoneySummaryCard title="Expenses" value={formatCurrency(data.totalExpenses)} icon={ArrowUpRight} tone="danger" />
        <MoneySummaryCard title="Loan Repayments" value={formatCurrency(data.loanRepayments)} icon={WalletCards} tone="warning" />
      </View>
      <MoneySummaryCard title="Available Cash" value={formatCurrency(data.availableCash)} subtitle={`Savings estimate ${formatCurrency(data.savingsEstimate)}`} icon={PiggyBank} />

      <View className="gap-3">
        <Text className="text-base font-black text-dark">Cycle Transactions</Text>
        {transactionsQuery.isLoading ? <LoadingState label="Loading transactions..." /> : null}
        {transactionsQuery.data?.transactions.map((transaction) => <TransactionCard key={transaction._id} transaction={transaction} />)}
      </View>
    </Screen>
  );
};
