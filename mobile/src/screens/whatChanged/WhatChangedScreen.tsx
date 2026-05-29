import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { AmountText } from "../../components/AmountText";
import { PlanningCard } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { SensitiveText } from "../../components/SensitiveText";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";

export const WhatChangedScreen = () => {
  const query = useQuery({ queryKey: ["what-changed"], queryFn: api.getWhatChanged });
  if (query.isLoading) return <Screen><LoadingState label="Comparing cycles..." /></Screen>;
  if (query.isError) return <Screen><ErrorState message="What changed insights load nahi ho sake." onRetry={query.refetch} /></Screen>;
  return (
    <Screen className="gap-5 pt-5">
      <Text className="text-2xl font-black text-dark">What Changed</Text>
      {query.data?.length ? query.data.map((item) => (
        <View key={item.id} className="rounded-3xl border border-border bg-card p-5">
          <Text className="text-base font-black text-dark">{item.title}</Text>
          <SensitiveText className="mt-1 text-sm font-semibold text-muted">{item.description}</SensitiveText>
          <View className="mt-4 flex-row gap-3">
            <PlanningCard title="Current" amount={item.currentValue} />
            <PlanningCard title="Previous" amount={item.previousValue} badge={`${item.changePercent}%`} />
          </View>
          <AmountText amount={item.changeAmount} prefix="Change: " className="mt-3 text-xs font-black text-muted" />
        </View>
      )) : <EmptyState title="No cycle comparison yet" subtitle="Current aur previous cycle data milte hi changes show honge." />}
    </Screen>
  );
};
