import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Pencil, WalletCards } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { Category } from "../../api/types";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency, formatDate } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const BudgetScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const budgetQuery = useQuery({ queryKey: ["budgets", "current"], queryFn: () => api.getCurrentBudget() });

  if (budgetQuery.isLoading) return <Screen><LoadingState label="Loading budget..." /></Screen>;
  if (budgetQuery.isError) return <Screen><ErrorState message="Budget load nahi ho saka." onRetry={budgetQuery.refetch} /></Screen>;
  const budget = budgetQuery.data;

  return (
    <Screen className="gap-5 pt-5">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Budget</Text>
          <Text className="mt-1 text-sm font-medium text-muted">Salary cycle budget aur category limits.</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.86}
          onPress={() => navigation.navigate("AddEditBudget", budget?._id ? { budgetId: budget._id } : undefined)}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-primary"
          style={theme.shadowSoft}
        >
          <Pencil color={theme.white} size={20} />
        </TouchableOpacity>
      </View>

      {budget ? (
        <>
          <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
            <View className="flex-row items-center gap-3">
              <WalletCards color={theme.primary} size={22} />
              <Text className="text-base font-black text-dark">Current Budget</Text>
            </View>
            <Text className="mt-3 text-3xl font-black text-dark">{formatCurrency(budget.totalBudget || 0)}</Text>
            <Text className="mt-1 text-sm font-semibold text-muted">
              Used {formatCurrency(budget.usedAmount || 0)} · Remaining {formatCurrency(budget.remainingBudget || 0)}
            </Text>
            <View className="mt-4">
              <ProgressBar progress={Math.min(100, budget.usedPercent || 0)} />
            </View>
            <Text className="mt-3 text-xs font-semibold text-muted">{formatDate(budget.cycleStartDate)} - {formatDate(budget.cycleEndDate)}</Text>
          </View>

          <View className="gap-3">
            <Text className="text-base font-black text-dark">Category Budgets</Text>
            {budget.categoryBudgets.length ? budget.categoryBudgets.map((item) => {
              const category = typeof item.categoryId === "string" ? undefined : (item.categoryId as Category);
              return (
                <View key={typeof item.categoryId === "string" ? item.categoryId : item.categoryId._id} className="rounded-3xl border border-border bg-card p-4" style={theme.shadowSoft}>
                  <Text className="text-base font-black text-dark">{category?.name || "Category"}</Text>
                  <Text className="mt-1 text-xs font-semibold text-muted">
                    {formatCurrency(item.usedAmount || 0)} used of {formatCurrency(item.amount)}
                  </Text>
                  <View className="mt-3"><ProgressBar progress={Math.min(100, item.usedPercent || 0)} /></View>
                </View>
              );
            }) : <EmptyState title="No category budgets" subtitle="Total budget ke sath category budgets bhi set kar sakte hain." />}
          </View>
        </>
      ) : (
        <>
          <EmptyState title="No budget set" subtitle="Monthly ya salary-cycle budget set karein." />
          <TouchableOpacity activeOpacity={0.86} onPress={() => navigation.navigate("AddEditBudget")} className="rounded-full bg-primary py-4">
            <Text className="text-center text-sm font-black text-white">Create Budget</Text>
          </TouchableOpacity>
        </>
      )}
    </Screen>
  );
};
