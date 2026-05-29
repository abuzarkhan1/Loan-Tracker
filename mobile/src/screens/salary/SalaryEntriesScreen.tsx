import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Banknote, Plus } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { SalaryEntry } from "../../api/types";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency, formatDate } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
const statuses = ["ALL", "EXPECTED", "RECEIVED", "MISSED"] as const;

const EntryCard = ({ entry, onPress }: { entry: SalaryEntry; onPress: () => void }) => {
  const { theme } = useAppTheme();
  const color = entry.status === "RECEIVED" ? theme.success : entry.status === "MISSED" ? theme.danger : theme.warning;
  return (
    <TouchableOpacity activeOpacity={0.86} onPress={onPress} className="flex-row items-center gap-4 rounded-3xl border border-border bg-card p-4" style={theme.shadowSoft}>
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-background-soft">
        <Banknote color={color} size={22} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-black text-dark">{formatCurrency(entry.amount)}</Text>
        <Text className="mt-1 text-xs font-semibold text-muted">{formatDate(entry.salaryDate)} · {entry.paymentMethod}</Text>
      </View>
      <View className="rounded-full px-3 py-1" style={{ backgroundColor: theme.backgroundSoft }}>
        <Text style={{ color, fontFamily: fontFamily.extraBold, fontSize: 10 }}>{entry.status}</Text>
      </View>
    </TouchableOpacity>
  );
};

export const SalaryEntriesScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const [status, setStatus] = useState<(typeof statuses)[number]>("ALL");
  const entriesQuery = useQuery({
    queryKey: ["salary", "entries", status],
    queryFn: () => api.getSalaryEntries({ status: status === "ALL" ? undefined : status, limit: 50 }),
  });

  return (
    <Screen className="gap-5 pt-5">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Salary Entries</Text>
          <Text className="mt-1 text-sm font-medium text-muted">Expected, received aur missed salary records.</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.86}
          onPress={() => navigation.navigate("SalaryEntryDetail")}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-primary"
          style={theme.shadowSoft}
        >
          <Plus color={theme.white} size={22} />
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {statuses.map((option) => {
          const active = option === status;
          return (
            <TouchableOpacity
              key={option}
              activeOpacity={0.86}
              onPress={() => setStatus(option)}
              className="rounded-full border px-4 py-2"
              style={{ borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : theme.pill }}
            >
              <Text style={{ color: active ? theme.white : theme.muted, fontFamily: fontFamily.bold, fontSize: 12 }}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {entriesQuery.isLoading ? <LoadingState label="Loading salary entries..." /> : null}
      {entriesQuery.isError ? <ErrorState message="Salary entries load nahi ho sake." onRetry={entriesQuery.refetch} /> : null}
      <View className="gap-3">
        {entriesQuery.data?.entries.length ? entriesQuery.data.entries.map((entry) => (
          <EntryCard key={entry._id} entry={entry} onPress={() => navigation.navigate("SalaryEntryDetail", { entryId: entry._id })} />
        )) : !entriesQuery.isLoading && !entriesQuery.isError ? (
          <EmptyState title="No salary entries" subtitle="Expected ya received salary entry add karein." />
        ) : null}
      </View>
    </Screen>
  );
};
