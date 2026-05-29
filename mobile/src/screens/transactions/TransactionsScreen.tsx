import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { PaymentMethod, TransactionType } from "../../api/types";
import { DatePickerField } from "../../components/DatePickerField";
import { FormSelect } from "../../components/FormSelect";
import { TransactionCard } from "../../components/TransactionCard";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { paymentMethodOptions, transactionTypeLabels } from "../../utils/finance";
import { fontFamily } from "../../utils/theme";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
const filters: Array<{ label: string; value?: TransactionType }> = [
  { label: "All" },
  { label: "Income", value: "INCOME" },
  { label: "Expense", value: "EXPENSE" },
  { label: "Salary", value: "SALARY" },
  { label: "Recovery", value: "LOAN_RECOVERY" },
  { label: "Repayment", value: "LOAN_REPAYMENT" },
];

export const TransactionsScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const [type, setType] = useState<TransactionType | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const categoryType = type === "INCOME" || type === "EXPENSE" ? type : undefined;
  const categoriesQuery = useQuery({
    queryKey: ["categories", "transaction-filter", categoryType],
    queryFn: () => api.getCategories({ type: categoryType }),
    enabled: Boolean(categoryType),
  });
  const transactionsQuery = useQuery({
    queryKey: ["transactions", type, paymentMethod, categoryId, dateFrom, dateTo],
    queryFn: () => api.getTransactions({
      type,
      paymentMethod,
      categoryId,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit: 50,
    }),
  });

  return (
    <Screen className="gap-5 pt-5">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Transactions</Text>
          <Text className="mt-1 text-sm font-medium text-muted">Income, expense, salary aur loan cash flow.</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.86}
          onPress={() => navigation.navigate("AddTransaction")}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-primary"
          style={theme.shadowSoft}
        >
          <Plus color={theme.white} size={22} />
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {filters.map((filter) => {
          const active = filter.value === type;
          return (
            <TouchableOpacity
              key={filter.label}
              activeOpacity={0.86}
              onPress={() => {
                setType(filter.value);
                setCategoryId(undefined);
              }}
              className="rounded-full border px-4 py-2"
              style={{ borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : theme.pill }}
            >
              <Text style={{ color: active ? theme.white : theme.muted, fontFamily: fontFamily.bold, fontSize: 12 }}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="rounded-3xl border border-border bg-card p-4" style={theme.shadowSoft}>
        <Text className="mb-3 text-sm font-black text-dark">Filters</Text>
        <FormSelect
          label="Payment Method"
          value={(paymentMethod || "ALL") as PaymentMethod | "ALL"}
          onChange={(value) => setPaymentMethod(value === "ALL" ? undefined : value)}
          options={[{ label: "All", value: "ALL" as const }, ...paymentMethodOptions]}
        />
        {categoryType ? (
          <View className="mt-4">
            <Text className="mb-2 text-sm font-bold text-muted">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              <TouchableOpacity
                activeOpacity={0.86}
                onPress={() => setCategoryId(undefined)}
                className="rounded-full border px-4 py-2"
                style={{ borderColor: !categoryId ? theme.primary : theme.border, backgroundColor: !categoryId ? theme.primary : theme.pill }}
              >
                <Text style={{ color: !categoryId ? theme.white : theme.muted, fontFamily: fontFamily.bold, fontSize: 12 }}>All</Text>
              </TouchableOpacity>
              {categoriesQuery.data?.map((category) => {
                const active = categoryId === category._id;
                return (
                  <TouchableOpacity
                    key={category._id}
                    activeOpacity={0.86}
                    onPress={() => setCategoryId(category._id)}
                    className="rounded-full border px-4 py-2"
                    style={{ borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : theme.pill }}
                  >
                    <Text style={{ color: active ? theme.white : theme.muted, fontFamily: fontFamily.bold, fontSize: 12 }}>{category.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <DatePickerField label="From" value={dateFrom} onChange={setDateFrom} />
          </View>
          <View className="flex-1">
            <DatePickerField label="To" value={dateTo} onChange={setDateTo} />
          </View>
        </View>
        {(paymentMethod || categoryId || dateFrom || dateTo) ? (
          <TouchableOpacity
            activeOpacity={0.86}
            onPress={() => {
              setPaymentMethod(undefined);
              setCategoryId(undefined);
              setDateFrom("");
              setDateTo("");
            }}
            className="mt-4 rounded-full bg-background-soft py-3"
          >
            <Text className="text-center text-sm font-black text-primary">Clear Filters</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {transactionsQuery.isLoading ? <LoadingState label="Loading transactions..." /> : null}
      {transactionsQuery.isError ? <ErrorState message="Transactions load nahi ho sake." onRetry={transactionsQuery.refetch} /> : null}

      {!transactionsQuery.isLoading && !transactionsQuery.isError ? (
        <View className="gap-3">
          {transactionsQuery.data?.transactions.length ? transactionsQuery.data.transactions.map((transaction) => (
            <TransactionCard
              key={transaction._id}
              transaction={transaction}
              onPress={() => navigation.navigate("TransactionDetail", { transactionId: transaction._id })}
            />
          )) : (
            <EmptyState
              title="No transactions yet"
              subtitle={type ? `${transactionTypeLabels[type]} records abhi nahi hain.` : "Add expense, income ya salary to start cash flow tracking."}
            />
          )}
        </View>
      ) : null}
    </Screen>
  );
};
