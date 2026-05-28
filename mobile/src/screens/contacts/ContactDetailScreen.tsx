import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { Edit3, Landmark, Plus, Trash2 } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { LoanCard } from "../../components/LoanCard";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { SummaryCard } from "../../components/SummaryCard";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency } from "../../utils/format";
import { getErrorMessage } from "../../utils/errors";

type Props = NativeStackScreenProps<RootStackParamList, "ContactDetail">;

export const ContactDetailScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const { contactId } = route.params;
  const contactQuery = useQuery({
    queryKey: ["contact", contactId],
    queryFn: () => api.getContact(contactId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteContact(contactId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      navigation.goBack();
    },
  });

  const confirmDelete = () => {
    Alert.alert("Delete contact", "Active loans hon to contact delete nahi hoga.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() },
    ]);
  };

  if (contactQuery.isLoading) return <Screen><LoadingState label="Loading contact..." /></Screen>;
  if (contactQuery.isError || !contactQuery.data) {
    return <Screen><ErrorState message="Contact load nahi ho saka." onRetry={contactQuery.refetch} /></Screen>;
  }

  const { contact, summary, recentLoans } = contactQuery.data;

  return (
    <Screen className="pt-5">
      <View className="rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <Text className="text-2xl font-black text-dark">{contact.name}</Text>
        <Text className="mt-2 text-sm font-medium text-muted">{contact.phone || contact.email || "No phone or email"}</Text>
        {contact.note ? <Text className="mt-3 text-sm text-dark">{contact.note}</Text> : null}
        {deleteMutation.isError ? (
          <Text className="mt-3 text-sm font-semibold text-danger">{getErrorMessage(deleteMutation.error)}</Text>
        ) : null}
        <View className="mt-5 flex-row gap-3">
          <View className="flex-1">
            <AppButton title="Edit" icon={Edit3} variant="secondary" onPress={() => navigation.navigate("ContactForm", { contactId })} />
          </View>
          <View className="flex-1">
            <AppButton title="Delete" icon={Trash2} variant="danger" onPress={confirmDelete} loading={deleteMutation.isPending} />
          </View>
        </View>
      </View>

      <View className="mt-5 flex-row flex-wrap justify-between gap-y-3">
        <SummaryCard label="Mujhe Lene Hain" value={formatCurrency(summary.netReceivable)} icon={Landmark} tone="success" />
        <SummaryCard label="Mujhe Dene Hain" value={formatCurrency(summary.netPayable)} icon={Landmark} tone="danger" />
        <SummaryCard label="Total Wapis Mila" value={formatCurrency(summary.totalReceivedBack)} icon={Landmark} tone="primary" />
        <SummaryCard label="Total Wapis Diya" value={formatCurrency(summary.totalPaidBack)} icon={Landmark} tone="warning" />
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-dark">Recent Loans</Text>
        <AppButton title="Naya Loan" icon={Plus} onPress={() => navigation.navigate("LoanForm", { contactId })} />
      </View>

      <View className="mt-4 gap-3">
        {recentLoans.length ? (
          recentLoans.map((loan) => (
            <LoanCard key={loan._id} loan={{ ...loan, contactId: contact }} onPress={() => navigation.navigate("LoanDetail", { loanId: loan._id })} />
          ))
        ) : (
          <EmptyState title="No loans" subtitle="Is contact ke saath abhi koi loan nahi." />
        )}
      </View>
    </Screen>
  );
};
