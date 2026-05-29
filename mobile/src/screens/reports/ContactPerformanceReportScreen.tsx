import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency } from "../../utils/format";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const ContactPerformanceReportScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const reportQuery = useQuery({ queryKey: ["reports", "contact-performance"], queryFn: () => api.getContactPerformanceReport() });

  if (reportQuery.isLoading) return <Screen><LoadingState label="Loading contact performance..." /></Screen>;
  if (reportQuery.isError || !reportQuery.data) return <Screen><ErrorState message="Contact performance load nahi ho saka." onRetry={reportQuery.refetch} /></Screen>;

  const contacts = reportQuery.data.contacts;
  return (
    <Screen className="pt-5">
      <Text className="text-2xl font-black text-dark">Contact Performance</Text>
      <Text className="mt-1 text-sm font-medium text-muted">Best paying, risky, aur highest pending contacts.</Text>

      <View className="mt-5 gap-3">
        {contacts.length ? contacts.map((contact) => (
          <TouchableOpacity
            key={contact.contactId}
            activeOpacity={0.88}
            onPress={() => navigation.navigate("ContactLoanProfile", { contactId: contact.contactId })}
            className="flex-row items-center gap-4 rounded-3xl border border-border bg-card p-4"
            style={theme.shadowSoft}
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-peach">
              <Trophy color={theme.primaryDark} size={22} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-black text-dark">{contact.contactName}</Text>
              <Text className="mt-1 text-xs font-semibold text-muted">Recovery {contact.recoveryRate}% - overdue {contact.overdueLoans}</Text>
            </View>
            <Text className="text-sm font-black text-primary">{formatCurrency(contact.remainingAmount)}</Text>
          </TouchableOpacity>
        )) : (
          <EmptyState title="No performance data" subtitle="Contacts ke saath loans add hon to report banegi." />
        )}
      </View>
    </Screen>
  );
};
