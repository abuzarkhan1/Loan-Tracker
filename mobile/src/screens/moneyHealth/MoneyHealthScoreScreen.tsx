import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";

export const MoneyHealthScoreScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const query = useQuery({ queryKey: ["money-health"], queryFn: api.getMoneyHealthScore });
  const openSuggestion = (route?: string, entityId?: string) => {
    if (route === "LoanForm" && entityId) navigation.navigate("LoanForm", { loanId: entityId });
    else if (route === "ContactForm" && entityId) navigation.navigate("ContactForm", { contactId: entityId });
    else if (route === "AddTransaction" && entityId) navigation.navigate("AddTransaction", { transactionId: entityId });
    else if (route === "AddEditBill" && entityId) navigation.navigate("AddEditBill", { billId: entityId });
    else if (route === "SettlementConfirmation" && entityId) navigation.navigate("SettlementConfirmation", { loanId: entityId });
    else if (route === "Promises") navigation.navigate("Promises", { status: "PENDING" });
    else if (route === "Contacts") navigation.navigate("MainTabs", { screen: "Contacts" });
    else if (route === "SmartEntryHistory") navigation.navigate("SmartEntryHistory");
    else navigation.navigate("DataQualityAssistant");
  };
  if (query.isLoading) return <Screen><LoadingState label="Calculating money health..." /></Screen>;
  if (query.isError || !query.data) return <Screen><ErrorState message="Money health score load nahi ho saka." onRetry={query.refetch} /></Screen>;
  const score = query.data;
  return (
    <Screen className="gap-5 pt-5">
      <View className="items-center rounded-3xl border border-border bg-card p-6" style={theme.shadowSoft}>
        <View className="h-32 w-32 items-center justify-center rounded-full border-8" style={{ borderColor: theme.primary }}>
          <Text className="text-4xl font-black text-dark">{score.score}</Text>
          <Text className="text-[10px] font-black uppercase text-muted">/100</Text>
        </View>
        <Text className="mt-5 text-xl font-black text-dark">{score.label.replace(/_/g, " ")}</Text>
        <Text className="mt-2 text-center text-sm font-semibold text-muted">{score.summary}</Text>
      </View>
      <Text className="text-base font-black text-dark">Breakdown</Text>
      {score.breakdown.map((item) => (
        <View key={item.factor} className="rounded-2xl border border-border bg-card p-4">
          <View className="flex-row justify-between gap-3">
            <Text className="flex-1 text-sm font-black text-dark">{item.factor}</Text>
            <Text className={`text-sm font-black ${item.impact < 0 ? "text-danger" : "text-success"}`}>{item.impact > 0 ? "+" : ""}{item.impact}</Text>
          </View>
          <Text className="mt-1 text-xs font-semibold text-muted">{item.message}</Text>
        </View>
      ))}
      {score.suggestions.length ? <Text className="text-base font-black text-dark">Suggestions</Text> : null}
      {score.suggestions.map((item) => (
        <TouchableOpacity
          key={item.title}
          activeOpacity={0.86}
          onPress={() => openSuggestion(item.actionRoute, item.entityId)}
          className="rounded-2xl bg-background-soft p-4"
        >
          <Text className="text-sm font-bold text-dark">{item.title}</Text>
          <Text className="mt-1 text-xs font-black text-primary">Fix issue</Text>
        </TouchableOpacity>
      ))}
      {!score.breakdown.length ? <EmptyState title="No score data" subtitle="Transactions add karein to score improve hoga." /> : null}
    </Screen>
  );
};
