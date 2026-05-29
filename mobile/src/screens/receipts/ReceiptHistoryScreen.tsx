import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { ReceiptText } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { StatusBadge } from "../../components/StatusBadge";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatDate } from "../../utils/format";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const ReceiptHistoryScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const receiptsQuery = useQuery({ queryKey: ["receipts"], queryFn: () => api.getReceipts({ limit: 50 }) });

  if (receiptsQuery.isLoading) return <Screen><LoadingState label="Loading receipts..." /></Screen>;
  if (receiptsQuery.isError) return <Screen><ErrorState message="Receipts load nahi ho sake." onRetry={receiptsQuery.refetch} /></Screen>;

  return (
    <Screen className="pt-5">
      <Text className="text-2xl font-black text-dark">Receipt History</Text>
      <Text className="mt-1 text-sm font-medium text-muted">Generated payment and loan receipts.</Text>

      <View className="mt-5 gap-3">
        {receiptsQuery.data?.receipts.length ? receiptsQuery.data.receipts.map((receipt) => (
          <TouchableOpacity
            key={receipt._id}
            activeOpacity={0.88}
            onPress={() => navigation.navigate("ReceiptPreview", { receiptId: receipt._id })}
            className="flex-row items-center gap-4 rounded-3xl border border-border bg-card p-4"
            style={theme.shadowSoft}
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-peach">
              <ReceiptText color={theme.primaryDark} size={22} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-black text-dark">{receipt.title}</Text>
              <Text className="mt-1 text-xs font-semibold text-muted">{receipt.receiptNumber} - {formatDate(receipt.createdAt)}</Text>
            </View>
            <StatusBadge value={receipt.status} />
          </TouchableOpacity>
        )) : (
          <EmptyState title="No receipts yet" subtitle="Loan ya payment detail se receipt generate karein." />
        )}
      </View>
    </Screen>
  );
};
