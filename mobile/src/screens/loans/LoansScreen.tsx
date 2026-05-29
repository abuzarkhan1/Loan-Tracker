import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Plus, Search, SlidersHorizontal } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { LoanStatus, LoanType } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { FormSelect } from "../../components/FormSelect";
import { LoanCard } from "../../components/LoanCard";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { LoanFilterParams, MainTabParamList, RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type LoansRoute = RouteProp<MainTabParamList, "Loans">;
type TypeFilter = "ALL" | LoanType;
type StatusFilter = "ALL" | LoanStatus;

export const LoansScreen = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<LoansRoute>();
  const { theme } = useAppTheme();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [advancedFilters, setAdvancedFilters] = useState<LoanFilterParams>({});

  useEffect(() => {
    if (route.params?.filters) {
      setAdvancedFilters(route.params.filters);
    }
  }, [route.params?.filters]);

  const loansQuery = useQuery({
    queryKey: ["loans", search, type, status, advancedFilters],
    queryFn: () =>
      api.getLoans({
        search,
        type: type === "ALL" ? undefined : type,
        status: status === "ALL" ? undefined : status,
        contactId: advancedFilters.contactId,
        minAmount: advancedFilters.minAmount ? Number(advancedFilters.minAmount) : undefined,
        maxAmount: advancedFilters.maxAmount ? Number(advancedFilters.maxAmount) : undefined,
        issueDateFrom: advancedFilters.issueDateFrom,
        issueDateTo: advancedFilters.issueDateTo,
        dueDateFrom: advancedFilters.dueDateFrom,
        dueDateTo: advancedFilters.dueDateTo,
        paymentMethod: advancedFilters.paymentMethod,
        hasProof: advancedFilters.hasProof,
        sortBy: advancedFilters.sortBy,
        sortOrder: advancedFilters.sortOrder,
        limit: 50,
      }),
  });
  const pinnedLoansQuery = useQuery({
    queryKey: ["loans", "pinned"],
    queryFn: () => api.getPinnedLoans(10),
  });

  return (
    <Screen className="pt-5">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-black text-dark">Loans</Text>
          <Text className="mt-1 text-sm font-medium text-muted">Given aur taken dono track karein.</Text>
        </View>
        <AppButton title="Naya Loan" icon={Plus} onPress={() => navigation.navigate("LoanForm")} />
      </View>

      <View
        className="mt-5 flex-row items-center gap-3 border border-border px-4"
        style={{ borderRadius: 14, backgroundColor: theme.input }}
      >
        <Search color={theme.muted} size={18} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          placeholder="Search loans"
          placeholderTextColor={theme.placeholder}
          returnKeyType="search"
          className="h-12 flex-1 text-base text-dark"
        />
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("AdvancedLoanFilters", { filters: advancedFilters })}
          className="h-9 w-9 items-center justify-center rounded-lg bg-peach"
        >
          <SlidersHorizontal color={theme.primaryDark} size={18} />
        </TouchableOpacity>
      </View>

      <View className="mt-4 gap-4">
        <AppButton
          title="Upcoming Installments"
          icon={CalendarClock}
          variant="secondary"
          onPress={() => navigation.navigate("UpcomingInstallments")}
        />
        <FormSelect
          label="Loan Type"
          value={type}
          onChange={setType}
          options={[
            { label: "All", value: "ALL" },
            { label: "Mujhe Lene Hain", value: "GIVEN" },
            { label: "Mujhe Dene Hain", value: "TAKEN" },
          ]}
        />
        <FormSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { label: "All", value: "ALL" },
            { label: "Active", value: "ACTIVE" },
            { label: "Partial", value: "PARTIALLY_PAID" },
            { label: "Completed", value: "COMPLETED" },
            { label: "Overdue", value: "OVERDUE" },
          ]}
        />
      </View>

      <View className="mt-5 gap-3">
        {pinnedLoansQuery.data?.length ? (
          <>
            <Text className="text-base font-black text-dark">Pinned Loans</Text>
            {pinnedLoansQuery.data.map((loan) => (
              <LoanCard key={`pinned-${loan._id}`} loan={loan} onPress={() => navigation.navigate("LoanDetail", { loanId: loan._id })} />
            ))}
            <View className="h-px bg-border" />
          </>
        ) : null}
        {loansQuery.isLoading ? <LoadingState label="Loading loans..." /> : null}
        {loansQuery.isError ? <ErrorState message="Loans load nahi ho sake." onRetry={loansQuery.refetch} /> : null}
        {loansQuery.data?.loans.length === 0 ? (
          <EmptyState title="No loans" subtitle="Naya Loan se pehla record create karein." />
        ) : null}
        {loansQuery.data?.loans.map((loan) => (
          <LoanCard key={loan._id} loan={loan} onPress={() => navigation.navigate("LoanDetail", { loanId: loan._id })} />
        ))}
      </View>
    </Screen>
  );
};
