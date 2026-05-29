import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Link2 } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { Contact } from "../../api/types";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { StatusBadge } from "../../components/StatusBadge";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency, formatDate } from "../../utils/format";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const contactName = (value: string | Contact) => (typeof value === "object" ? value.name : "Contact");

export const PaymentRequestsHistoryScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const requestsQuery = useQuery({ queryKey: ["paymentRequests"], queryFn: () => api.getPaymentRequests({ limit: 50 }) });

  if (requestsQuery.isLoading) return <Screen><LoadingState label="Loading payment requests..." /></Screen>;
  if (requestsQuery.isError) return <Screen><ErrorState message="Payment requests load nahi ho sakin." onRetry={requestsQuery.refetch} /></Screen>;

  const requests = requestsQuery.data?.paymentRequests || [];

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Payment Requests</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Generated aur shared request history.</Text>
      </View>

      <View className="mt-5 gap-3">
        {requests.length ? (
          requests.map((request) => (
            <TouchableOpacity
              key={request._id}
              activeOpacity={0.88}
              onPress={() => navigation.navigate("PaymentRequestPreview", { requestId: request._id })}
              className="rounded-lg border border-border bg-card p-4"
              style={theme.shadowSoft}
            >
              <View className="flex-row items-start gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-lg bg-peach">
                  <Link2 color={theme.primaryDark} size={20} />
                </View>
                <View className="flex-1">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text className="text-base font-black text-dark">{contactName(request.contactId)}</Text>
                    <StatusBadge value={request.status} />
                  </View>
                  <Text className="mt-2 text-xl font-black text-primary">{formatCurrency(request.amountRequested)}</Text>
                  <Text className="mt-1 text-xs font-bold text-muted">{request.requestNumber} · {formatDate(request.createdAt)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyState title="No payment requests" subtitle="Loan detail se request create karein." />
        )}
      </View>
    </Screen>
  );
};
