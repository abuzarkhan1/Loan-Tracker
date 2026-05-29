import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { Bot, Send } from "lucide-react-native";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { AmountText } from "../../components/AmountText";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { fontFamily } from "../../utils/theme";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const quickQuestions = [
  "Mera current cash flow kya hai?",
  "Kis se sabse zyada paisay lene hain?",
  "Mera biggest expense category kya hai?",
  "Can I afford 20000 this month?",
  "What changed in my expenses?",
  "Show my money health",
  "How much cash will remain?",
  "Kaunse bills upcoming hain?",
];

const routeMap: Record<string, keyof RootStackParamList> = {
  MoneyHealthScore: "MoneyHealthScore",
  CashForecast: "CashForecast",
  WhatChanged: "WhatChanged",
  ScenarioPlanner: "ScenarioPlanner",
  DataQualityAssistant: "DataQualityAssistant",
  BudgetRecommendations: "BudgetRecommendations",
  AffordabilityCalculator: "AffordabilityCalculator",
  Bills: "Bills",
  FinanceInsights: "FinanceInsights",
  Reports: "MainTabs",
  Contacts: "MainTabs",
  Money: "MainTabs",
};

export const FinanceAssistantScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const [question, setQuestion] = useState("");
  const mutation = useMutation({ mutationFn: api.askAssistant });

  const ask = (text = question) => {
    if (!text.trim()) return;
    setQuestion(text);
    mutation.mutate(text);
  };

  const openAction = (route: string) => {
    if (route === "Money") navigation.navigate("MainTabs", { screen: "Money" });
    else if (route === "Contacts") navigation.navigate("MainTabs", { screen: "Contacts" });
    else if (route === "Reports") navigation.navigate("MainTabs", { screen: "Reports" });
    else {
      const target = routeMap[route];
      if (target && target !== "MainTabs") navigation.navigate(target as never);
    }
  };

  const renderCardValue = (value: unknown) => {
    if (typeof value === "number") return <AmountText amount={value} className="mt-1 text-lg font-black text-dark" />;
    if (typeof value === "string") return <Text className="mt-1 text-sm font-bold text-dark">{value}</Text>;
    if (value === undefined || value === null) return null;
    return <Text className="mt-1 text-xs font-semibold text-muted">{JSON.stringify(value)}</Text>;
  };

  return (
    <Screen className="gap-5 pt-5">
      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-peach">
            <Bot color={theme.primaryDark} size={26} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Finance Assistant</Text>
            <Text className="mt-1 text-sm font-semibold text-muted">Rule-based answers. Koi paid AI ya private data upload nahi.</Text>
          </View>
        </View>
      </View>

      <View className="rounded-3xl border border-border bg-card p-4" style={theme.shadowSoft}>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="Ask about cash flow, budget, loans..."
          placeholderTextColor={theme.placeholder}
          multiline
          className="min-h-[96px] rounded-2xl bg-background-soft px-4 py-4 text-sm font-semibold text-dark"
          textAlignVertical="top"
        />
        <View className="mt-4">
          <AppButton title="Ask Assistant" icon={Send} loading={mutation.isPending} disabled={!question.trim()} onPress={() => ask()} />
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {quickQuestions.map((item) => (
          <TouchableOpacity key={item} activeOpacity={0.86} onPress={() => ask(item)} className="rounded-full bg-background-soft px-4 py-2">
            <Text className="text-xs font-black text-muted">{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}

      {mutation.data ? (
        <View className="gap-4">
          <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
            <Text className="text-base font-black text-dark">Answer</Text>
            <Text className="mt-3 text-sm font-semibold leading-6 text-muted">{mutation.data.answer}</Text>
          </View>
          {Array.isArray(mutation.data.cards) && mutation.data.cards.length ? (
            <View className="gap-3">
              <Text className="text-base font-black text-dark">Answer Cards</Text>
              {mutation.data.cards.slice(0, 6).map((card, index) => {
                const item = card as { title?: string; label?: string; value?: unknown; contactName?: string; name?: string; amount?: number; remainingAmount?: number };
                const title = item.title || item.label || item.contactName || item.name || `Card ${index + 1}`;
                const value = item.value ?? item.amount ?? item.remainingAmount;
                return (
                  <View key={`${title}-${index}`} className="rounded-2xl border border-border bg-card p-4" style={theme.shadowSoft}>
                    <Text className="text-sm font-black text-dark">{title}</Text>
                    {renderCardValue(value)}
                  </View>
                );
              })}
            </View>
          ) : null}
          {mutation.data.suggestedActions.length ? (
            <View className="gap-3">
              <Text className="text-base font-black text-dark">Suggested Actions</Text>
              {mutation.data.suggestedActions.map((action) => {
                const target = routeMap[action.route];
                return (
                  <TouchableOpacity
                    key={`${action.label}-${action.route}`}
                    activeOpacity={0.86}
                    onPress={() => openAction(action.route)}
                    className="rounded-2xl border border-border bg-card p-4"
                    style={theme.shadowSoft}
                  >
                    <Text className="text-sm font-black text-dark">{action.label}</Text>
                    <Text className="mt-1 text-xs font-semibold text-muted">{target ? "Open screen" : "Action suggestion"}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
};
