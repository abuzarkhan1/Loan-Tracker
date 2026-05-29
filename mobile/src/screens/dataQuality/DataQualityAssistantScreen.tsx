import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { fontFamily } from "../../utils/theme";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const DataQualityAssistantScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["data-quality"], queryFn: api.getDataQualityIssues });
  const resolveMutation = useMutation({
    mutationFn: api.resolveDataQualityIssue,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["data-quality"] }),
  });

  const openIssue = (route?: string, entityId?: string) => {
    if (route === "LoanForm" && entityId) navigation.navigate("LoanForm", { loanId: entityId });
    else if (route === "LoanDetail" && entityId) navigation.navigate("LoanDetail", { loanId: entityId });
    else if (route === "ContactForm" && entityId) navigation.navigate("ContactForm", { contactId: entityId });
    else if (route === "ContactLoanProfile" && entityId) navigation.navigate("ContactLoanProfile", { contactId: entityId });
    else if (route === "AddTransaction" && entityId) navigation.navigate("AddTransaction", { transactionId: entityId });
    else if (route === "TransactionDetail" && entityId) navigation.navigate("TransactionDetail", { transactionId: entityId });
    else if (route === "AddEditBill" && entityId) navigation.navigate("AddEditBill", { billId: entityId });
    else if (route === "BillDetail" && entityId) navigation.navigate("BillDetail", { billId: entityId });
    else if (route === "SettlementConfirmation" && entityId) navigation.navigate("SettlementConfirmation", { loanId: entityId });
    else if (route === "Promises") navigation.navigate("Promises", { status: "PENDING" });
    else if (route === "Contacts") navigation.navigate("MainTabs", { screen: "Contacts" });
    else if (route === "SmartEntryHistory") navigation.navigate("SmartEntryHistory");
  };

  if (query.isLoading) return <Screen><LoadingState label="Checking data quality..." /></Screen>;
  if (query.isError || !query.data) return <Screen><ErrorState message="Data quality check load nahi ho saka." onRetry={query.refetch} /></Screen>;

  return (
    <Screen className="gap-5 pt-5">
      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-mint">
            <ShieldCheck color={theme.success} size={26} />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-black uppercase text-muted">Finance Data Score</Text>
            <Text className="mt-1 text-3xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>{query.data.score}/100</Text>
          </View>
        </View>
        <Text className="mt-4 text-sm font-semibold text-muted">
          {query.data.totalIssues} issues found · {query.data.resolvedCount} resolved
        </Text>
      </View>

      <View className="gap-3">
        <Text className="text-base font-black text-dark">Fix Suggestions</Text>
        {query.data.issues.length ? query.data.issues.map((issue) => {
          return (
            <View key={issue.id} className="rounded-3xl border border-border bg-card p-4" style={theme.shadowSoft}>
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-black text-dark">{issue.title}</Text>
                  <Text className="mt-1 text-xs font-semibold text-muted">{issue.description}</Text>
                  <Text className="mt-2 text-[10px] font-black uppercase text-primary">{issue.severity}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.86}
                  onPress={() => resolveMutation.mutate(issue.id)}
                  className="h-10 w-10 items-center justify-center rounded-full bg-background-soft"
                >
                  <CheckCircle2 color={theme.success} size={18} />
                </TouchableOpacity>
              </View>
              <View className="mt-4 flex-row gap-3">
                <View className="flex-1">
                  <AppButton title={issue.actionLabel || "Open"} variant="secondary" onPress={() => openIssue(issue.actionRoute, issue.entityId)} />
                </View>
                <View className="flex-1">
                  <AppButton title="Mark Done" loading={resolveMutation.isPending} onPress={() => resolveMutation.mutate(issue.id)} />
                </View>
              </View>
            </View>
          );
        }) : (
          <EmptyState title="Everything looks clean" subtitle="Data quality assistant ko koi issue nahi mila." />
        )}
      </View>

      {resolveMutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(resolveMutation.error)}</Text> : null}
    </Screen>
  );
};
