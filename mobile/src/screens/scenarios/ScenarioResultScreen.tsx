import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowDownRight, ArrowUpRight, ShieldAlert } from "lucide-react-native";
import { Text, View } from "react-native";
import { AppButton } from "../../components/AppButton";
import { AmountText } from "../../components/AmountText";
import { PlanningCard } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { fontFamily } from "../../utils/theme";

type Route = RouteProp<RootStackParamList, "ScenarioResult">;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const ScenarioResultScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const { result } = useRoute<Route>().params;
  const riskColor = result.riskLevel === "LOW" ? theme.success : result.riskLevel === "MEDIUM" ? theme.warning : theme.danger;

  return (
    <Screen className="gap-5 pt-5">
      <View className="rounded-3xl border border-border bg-card p-6" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-background-soft">
            <ShieldAlert color={riskColor} size={26} />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-black uppercase text-muted">Risk Level</Text>
            <Text className="mt-1 text-2xl font-black text-dark" style={{ color: riskColor, fontFamily: fontFamily.extraBold }}>
              {result.riskLevel}
            </Text>
          </View>
        </View>
        <Text className="mt-5 text-base font-black text-dark">{result.summary}</Text>
      </View>

      <View className="flex-row gap-3">
        <PlanningCard title="Before" amount={result.projectedCashBefore} icon={ArrowUpRight} />
        <PlanningCard title="After" amount={result.projectedCashAfter} icon={ArrowDownRight} />
      </View>

      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <Text className="text-xs font-black uppercase text-muted">Impact</Text>
        <AmountText amount={result.impactAmount} className="mt-2 text-3xl font-black text-dark" />
      </View>

      {result.warnings.length ? (
        <View className="gap-3">
          <Text className="text-base font-black text-dark">Warnings</Text>
          {result.warnings.map((warning) => (
            <View key={warning} className="rounded-2xl bg-peach p-4">
              <Text className="text-sm font-bold text-danger">{warning}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {result.suggestions.length ? (
        <View className="gap-3">
          <Text className="text-base font-black text-dark">Suggestions</Text>
          {result.suggestions.map((suggestion) => (
            <View key={suggestion} className="rounded-2xl bg-background-soft p-4">
              <Text className="text-sm font-bold text-dark">{suggestion}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <AppButton title="Back to Money" variant="secondary" onPress={() => navigation.navigate("MainTabs", { screen: "Money" })} />
    </Screen>
  );
};
