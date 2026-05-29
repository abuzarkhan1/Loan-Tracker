import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus } from "lucide-react-native";
import { Text, View } from "react-native";
import { AppButton } from "../../components/AppButton";
import { PlanningCard } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "AffordabilityResult">;

export const AffordabilityResultScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { result } = useRoute<Route>().params;
  return (
    <Screen className="gap-5 pt-5">
      <PlanningCard title={result.result.replace(/_/g, " ")} subtitle="Spending guidance based on your records" amount={result.projectedCashAfterPurchase} badge="After purchase" />
      <View className="flex-row gap-3">
        <PlanningCard title="Safe Limit" amount={result.safeSpendingLimit} />
        <PlanningCard title="Current Cash" amount={result.currentAvailableCash} />
      </View>
      <Text className="text-base font-black text-dark">Reasons</Text>
      {result.reasons.map((reason) => (
        <Text key={reason} className="rounded-2xl bg-card p-4 text-sm font-semibold text-muted">{reason}</Text>
      ))}
      <Text className="text-base font-black text-dark">Suggestions</Text>
      {result.suggestions.map((suggestion) => (
        <Text key={suggestion} className="rounded-2xl bg-card p-4 text-sm font-semibold text-muted">{suggestion}</Text>
      ))}
      <AppButton title="Add as Expense" icon={Plus} onPress={() => navigation.navigate("AddExpense")} />
    </Screen>
  );
};
