import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, History, Sparkles, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { ScenarioResult } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { AmountText } from "../../components/AmountText";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { formatDateTime } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const scenarioOptions: Array<{ label: string; value: ScenarioResult["type"]; hint: string }> = [
  { label: "Purchase", value: "PURCHASE", hint: "Agar kuch khareedna ho" },
  { label: "Reduce Expense", value: "REDUCE_EXPENSE", hint: "Expense kam karne ka impact" },
  { label: "Extra Loan Pay", value: "EXTRA_LOAN_PAYMENT", hint: "Loan jaldi pay karna" },
  { label: "Salary Delay", value: "SALARY_DELAY", hint: "Salary late ho jaye" },
  { label: "Extra Saving", value: "EXTRA_SAVING", hint: "Goal mein extra save" },
];

export const ScenarioPlannerScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const [type, setType] = useState<ScenarioResult["type"]>("PURCHASE");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saveScenario, setSaveScenario] = useState(true);
  const historyQuery = useQuery({ queryKey: ["scenarios", "history"], queryFn: api.getScenarioHistory });
  const mutation = useMutation({
    mutationFn: () => api.simulateScenario({ type, amount: Number(amount), note: note || undefined, save: saveScenario }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["scenarios", "history"] });
      navigation.navigate("ScenarioResult", { result });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: api.deleteScenario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["scenarios", "history"] }),
  });

  return (
    <Screen className="gap-5 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Scenario Planner</Text>
        <Text className="mt-1 text-sm font-semibold text-muted">What-if check karein before spending or planning.</Text>
      </View>

      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-peach">
            <Sparkles color={theme.primaryDark} size={22} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-black text-dark">Plan safely</Text>
            <Text className="mt-1 text-xs font-semibold text-muted">Projected cash, risk, aur warnings dekhein.</Text>
          </View>
        </View>

        <Text className="mt-5 text-xs font-black uppercase text-muted">Scenario Type</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {scenarioOptions.map((option) => {
            const active = option.value === type;
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.86}
                onPress={() => setType(option.value)}
                className="rounded-full border px-4 py-2"
                style={{ backgroundColor: active ? theme.primary : theme.pill, borderColor: active ? theme.primary : theme.border }}
              >
                <Text className="text-xs font-black" style={{ color: active ? theme.white : theme.muted }}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="mt-5 text-xs font-black uppercase text-muted">Amount</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="25000"
          placeholderTextColor={theme.placeholder}
          className="mt-2 rounded-2xl border border-border bg-input px-4 py-4 text-xl font-black text-dark"
        />

        <Text className="mt-5 text-xs font-black uppercase text-muted">Note</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={scenarioOptions.find((item) => item.value === type)?.hint}
          placeholderTextColor={theme.placeholder}
          multiline
          className="mt-2 min-h-[92px] rounded-2xl border border-border bg-input px-4 py-4 text-sm font-semibold text-dark"
          textAlignVertical="top"
        />

        <TouchableOpacity
          activeOpacity={0.86}
          onPress={() => setSaveScenario((value) => !value)}
          className="mt-5 flex-row items-center justify-between rounded-2xl bg-background-soft p-4"
        >
          <View className="flex-1">
            <Text className="text-sm font-black text-dark">Save to history</Text>
            <Text className="mt-1 text-xs font-semibold text-muted">Off karne par result sirf is session mein show hoga.</Text>
          </View>
          <View className="h-7 w-12 justify-center rounded-full px-1" style={{ backgroundColor: saveScenario ? theme.primary : theme.border }}>
            <View className="h-5 w-5 rounded-full bg-white" style={{ alignSelf: saveScenario ? "flex-end" : "flex-start" }} />
          </View>
        </TouchableOpacity>
      </View>

      {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}
      <AppButton
        title="Simulate Scenario"
        icon={Calculator}
        loading={mutation.isPending}
        disabled={!Number(amount)}
        onPress={() => mutation.mutate()}
      />

      <View className="mt-2">
        <View className="mb-3 flex-row items-center gap-2">
          <History color={theme.primary} size={18} />
          <Text className="text-base font-black text-dark">Recent Scenarios</Text>
        </View>
        <View className="gap-3">
          {historyQuery.data?.length ? historyQuery.data.slice(0, 4).map((item) => (
            <View key={item._id} className="rounded-2xl border border-border bg-card p-4" style={theme.shadowSoft}>
              <View className="flex-row items-center justify-between gap-3">
                <TouchableOpacity className="flex-1" activeOpacity={0.86} onPress={() => navigation.navigate("ScenarioResult", { result: item.resultData })}>
                  <Text className="text-sm font-black text-dark">{item.type.replace(/_/g, " ")}</Text>
                  <Text className="mt-1 text-xs font-semibold text-muted">{formatDateTime(item.createdAt)}</Text>
                </TouchableOpacity>
                <AmountText amount={item.resultData.projectedCashAfter} className="text-sm font-black text-primary" />
                <TouchableOpacity
                  activeOpacity={0.86}
                  onPress={() => deleteMutation.mutate(item._id)}
                  className="h-9 w-9 items-center justify-center rounded-full bg-background-soft"
                >
                  <Trash2 color={theme.danger} size={16} />
                </TouchableOpacity>
              </View>
            </View>
          )) : (
            <EmptyState title="No scenarios yet" subtitle="Pehla scenario run karein." />
          )}
        </View>
      </View>
    </Screen>
  );
};
