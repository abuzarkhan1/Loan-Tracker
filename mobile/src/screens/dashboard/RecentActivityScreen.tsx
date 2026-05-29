import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Activity, Search } from "lucide-react-native";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatDate } from "../../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "RecentActivity">;

export const RecentActivityScreen = ({ route }: Props) => {
  const { theme } = useAppTheme();
  const [search, setSearch] = useState("");
  const contactId = route.params?.contactId;
  const activityQuery = useQuery({
    queryKey: ["activity", "recent", contactId, search],
    queryFn: () => api.getRecentActivity({ contactId, search, limit: 50 }),
  });

  if (activityQuery.isLoading) return <Screen><LoadingState label="Loading activity..." /></Screen>;
  if (activityQuery.isError) return <Screen><ErrorState message="Activity load nahi ho saki." onRetry={activityQuery.refetch} /></Screen>;

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Recent Activity</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Loans, payments, reports, receipts aur reminders.</Text>
      </View>

      <View className="mt-5 flex-row items-center gap-3 border border-border px-4" style={{ borderRadius: 18, backgroundColor: theme.input }}>
        <Search color={theme.muted} size={18} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search activity"
          placeholderTextColor={theme.placeholder}
          className="h-12 flex-1 text-base text-dark"
        />
      </View>

      <View className="mt-5 gap-3">
        {activityQuery.data?.activities.length ? activityQuery.data.activities.map((item) => (
          <View key={item.id} className="flex-row items-start gap-3 rounded-3xl border border-border bg-card p-4" style={theme.shadowSoft}>
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-background-soft">
              <Activity color={theme.primary} size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-black uppercase text-muted">{item.type.replace(/_/g, " ")}</Text>
              <Text className="mt-1 text-base font-black text-dark">{item.title}</Text>
              <Text className="mt-1 text-sm font-semibold text-muted">{item.description}</Text>
              <Text className="mt-2 text-xs font-bold text-primary">{formatDate(item.createdAt)}</Text>
            </View>
          </View>
        )) : (
          <EmptyState title="No activity found" subtitle="New loans, payments, receipts aur reports yahan show hongay." />
        )}
      </View>
    </Screen>
  );
};
