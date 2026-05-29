import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ExportExcel">;

export const ExportExcelScreen = ({ navigation }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const contactsQuery = useQuery({
    queryKey: ["contacts", "excel-picker"],
    queryFn: () => api.getContacts({ page: 1, limit: 50 }),
  });

  const mutation = useMutation({
    mutationFn: (action: "loans" | "payments" | "contact") => {
      if (action === "payments") return api.createPaymentsExcelExport();
      if (action === "contact" && selectedContactId) return api.createContactExcelExport(selectedContactId);
      return api.createLoansExcelExport();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reports-history"] });
      navigation.navigate("ReportHistory");
    },
  });

  if (contactsQuery.isLoading) return <Screen><LoadingState label="Loading export options..." /></Screen>;

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Export Excel</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Loans, payments, aur contact-wise report export karein.</Text>
      </View>

      <View className="mt-6 gap-3">
        <AppButton title="Export All Loans" icon={FileSpreadsheet} loading={mutation.isPending} onPress={() => mutation.mutate("loans")} />
        <AppButton title="Export Payments" icon={FileSpreadsheet} variant="secondary" loading={mutation.isPending} onPress={() => mutation.mutate("payments")} />
      </View>

      <View className="mt-6 gap-4 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <Text className="text-base font-bold text-dark">Contact-wise Export</Text>
        <View className="flex-row flex-wrap gap-2">
          {(contactsQuery.data?.contacts || []).map((contact) => {
            const selected = selectedContactId === contact._id;
            return (
              <TouchableOpacity
                key={contact._id}
                activeOpacity={0.85}
                onPress={() => setSelectedContactId(contact._id)}
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? theme.primary : theme.border,
                  backgroundColor: selected ? theme.primary : theme.pill,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                }}
              >
                <Text style={{ color: selected ? theme.white : theme.muted, fontFamily: fontFamily.bold, fontSize: 12 }}>
                  {contact.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <AppButton
          title="Export Contact Report"
          icon={FileSpreadsheet}
          disabled={!selectedContactId}
          loading={mutation.isPending}
          onPress={() => mutation.mutate("contact")}
        />
      </View>

      {mutation.isError ? <Text className="mt-4 text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}
    </Screen>
  );
};
