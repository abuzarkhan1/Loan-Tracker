import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react-native";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { api } from "../../api/client";
import { LoanStatus, LoanType } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { FormSelect } from "../../components/FormSelect";
import { LoanCard } from "../../components/LoanCard";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type TypeFilter = "ALL" | LoanType;
type StatusFilter = "ALL" | LoanStatus;

export const LoansScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { theme } = useAppTheme();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");

  const loansQuery = useQuery({
    queryKey: ["loans", search, type, status],
    queryFn: () =>
      api.getLoans({
        search,
        type: type === "ALL" ? undefined : type,
        status: status === "ALL" ? undefined : status,
        limit: 50,
      }),
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
          placeholder="Search loans"
          placeholderTextColor={theme.placeholder}
          className="h-12 flex-1 text-base text-dark"
        />
      </View>

      <View className="mt-4 gap-4">
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
