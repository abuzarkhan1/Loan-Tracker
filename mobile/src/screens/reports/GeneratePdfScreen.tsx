import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, History, UserRound, Calendar, Globe } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { EmptyState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "GeneratePdf">;
type PdfTab = "client" | "monthly" | "complete";

export const GeneratePdfScreen = ({ navigation }: Props) => {
  const { theme, mode } = useAppTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<PdfTab>("client");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const contactsQuery = useQuery({
    queryKey: ["contacts", "report-picker"],
    queryFn: () => api.getContacts({ page: 1, limit: 100 }),
  });

  const mutation = useMutation({
    mutationFn: (action: "contact" | "monthly" | "complete") => {
      if (action === "contact" && selectedContactId) return api.createContactPdfReport(selectedContactId);
      if (action === "monthly") return api.createMonthlyPdfReport({ month: Number(month), year: Number(year) });
      return api.createCompleteHistoryPdfReport();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reports-history"] });
      navigation.navigate("ReportHistory");
    },
  });

  if (contactsQuery.isLoading) return <Screen><LoadingState label="Loading contacts list..." /></Screen>;

  const contacts = contactsQuery.data?.contacts || [];

  return (
    <Screen className="pt-5">
      {/* --- Header Section --- */}
        <View>
          <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Generate PDF</Text>
          <Text className="mt-1 text-xs font-medium text-muted" style={{ fontFamily: fontFamily.medium }}>Select a document type to compile accounts ledgers in background.</Text>
        </View>

        {/* --- Premium Segmented Tab Selector --- */}
        <View 
          className="mt-6 flex-row rounded-2xl p-1.5 border border-border"
          style={{ backgroundColor: theme.input }}
        >
          {/* Tab 1: Client Ledger */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab("client")}
            className="flex-1 py-3 items-center justify-center rounded-xl"
            style={{
              backgroundColor: activeTab === "client" ? theme.card : "transparent",
              ...((activeTab === "client" && theme.shadowSoft) || {}),
            }}
          >
            <Text 
              style={{
                fontFamily: fontFamily.bold,
                fontSize: 12,
                color: activeTab === "client" ? theme.primary : theme.muted,
              }}
            >
              Client Ledger
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Monthly Summary */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab("monthly")}
            className="flex-1 py-3 items-center justify-center rounded-xl"
            style={{
              backgroundColor: activeTab === "monthly" ? theme.card : "transparent",
              ...((activeTab === "monthly" && theme.shadowSoft) || {}),
            }}
          >
            <Text 
              style={{
                fontFamily: fontFamily.bold,
                fontSize: 12,
                color: activeTab === "monthly" ? theme.primary : theme.muted,
              }}
            >
              Monthly Summary
            </Text>
          </TouchableOpacity>

          {/* Tab 3: Complete History */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab("complete")}
            className="flex-1 py-3 items-center justify-center rounded-xl"
            style={{
              backgroundColor: activeTab === "complete" ? theme.card : "transparent",
              ...((activeTab === "complete" && theme.shadowSoft) || {}),
            }}
          >
            <Text 
              style={{
                fontFamily: fontFamily.bold,
                fontSize: 12,
                color: activeTab === "complete" ? theme.primary : theme.muted,
              }}
            >
              All Time
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- Form Segment Displays --- */}
        {activeTab === "client" ? (
          <View className="mt-6 gap-6 rounded-3xl border border-border bg-card p-6" style={theme.shadowSoft}>
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: mode === "light" ? "#fff1ea" : "rgba(243, 111, 86, 0.08)" }}>
                <UserRound color={theme.primary} size={18} />
              </View>
              <View>
                <Text className="text-base font-bold text-dark" style={{ fontFamily: fontFamily.bold }}>Client Statement</Text>
                <Text className="text-xs text-muted" style={{ fontFamily: fontFamily.medium }}>Select a client from the deck below.</Text>
              </View>
            </View>

            {/* Premium Horizontal Contact Avatar Carousel */}
            {contacts.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 14, paddingVertical: 4 }}
              >
                {contacts.map((contact) => {
                  const selected = selectedContactId === contact._id;
                  const initial = contact.name.trim().charAt(0).toUpperCase();

                  return (
                    <TouchableOpacity
                      key={contact._id}
                      activeOpacity={0.9}
                      onPress={() => setSelectedContactId(selected ? null : contact._id)}
                      className="items-center"
                      style={{ width: 68 }}
                    >
                      {/* Avatar Circle */}
                      <View
                        className="h-14 w-14 items-center justify-center rounded-full border-2"
                        style={{
                          backgroundColor: selected 
                            ? theme.primary 
                            : (mode === "light" ? "#fff7ef" : "#2b2631"),
                          borderColor: selected ? theme.primary : theme.border,
                          shadowColor: selected ? theme.primary : "transparent",
                          shadowOpacity: 0.15,
                          shadowRadius: 8,
                          shadowOffset: { width: 0, height: 4 },
                        }}
                      >
                        {selected ? (
                          <Text style={{ fontFamily: fontFamily.extraBold, fontSize: 18, color: theme.white }}>✓</Text>
                        ) : (
                          <Text style={{ fontFamily: fontFamily.extraBold, fontSize: 18, color: theme.primary }}>{initial}</Text>
                        )}
                      </View>
                      
                      {/* Contact Name Label */}
                      <Text
                        numberOfLines={1}
                        className="mt-2 text-center text-xs font-semibold"
                        style={{
                          fontFamily: selected ? fontFamily.bold : fontFamily.medium,
                          color: selected ? theme.primary : theme.text,
                        }}
                      >
                        {contact.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <EmptyState title="No clients found" subtitle="Pehle contacts register karein." />
            )}

            <AppButton
              title="Generate Client Statement"
              icon={FileText}
              disabled={!selectedContactId}
              loading={mutation.isPending}
              onPress={() => mutation.mutate("contact")}
            />
          </View>
        ) : null}

        {activeTab === "monthly" ? (
          <View className="mt-6 gap-6 rounded-3xl border border-border bg-card p-6" style={theme.shadowSoft}>
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: mode === "light" ? "#fff1ea" : "rgba(243, 111, 86, 0.08)" }}>
                <Calendar color={theme.primary} size={18} />
              </View>
              <View>
                <Text className="text-base font-bold text-dark" style={{ fontFamily: fontFamily.bold }}>Monthly Report Summary</Text>
                <Text className="text-xs text-muted" style={{ fontFamily: fontFamily.medium }}>Select target month and year parameters.</Text>
              </View>
            </View>

            {/* Inputs Grid */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 11, marginBottom: 8 }}>MONTH (MM)</Text>
                <TextInput
                  value={month}
                  onChangeText={setMonth}
                  keyboardType="number-pad"
                  placeholder="e.g. 5"
                  placeholderTextColor={theme.placeholder}
                  style={{
                    minHeight: 52,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: theme.border,
                    backgroundColor: theme.input,
                    color: theme.text,
                    fontFamily: fontFamily.bold,
                    fontSize: 15,
                    paddingHorizontal: 18,
                  }}
                />
              </View>
              <View className="flex-1">
                <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 11, marginBottom: 8 }}>YEAR (YYYY)</Text>
                <TextInput
                  value={year}
                  onChangeText={setYear}
                  keyboardType="number-pad"
                  placeholder="e.g. 2026"
                  placeholderTextColor={theme.placeholder}
                  style={{
                    minHeight: 52,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: theme.border,
                    backgroundColor: theme.input,
                    color: theme.text,
                    fontFamily: fontFamily.bold,
                    fontSize: 15,
                    paddingHorizontal: 18,
                  }}
                />
              </View>
            </View>

            <AppButton 
              title="Generate Monthly Report" 
              icon={FileText} 
              loading={mutation.isPending} 
              onPress={() => mutation.mutate("monthly")} 
            />
          </View>
        ) : null}

        {activeTab === "complete" ? (
          <View className="mt-6 gap-6 rounded-3xl border border-border bg-card p-6" style={theme.shadowSoft}>
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: mode === "light" ? "#fff1ea" : "rgba(243, 111, 86, 0.08)" }}>
                <Globe color={theme.primary} size={18} />
              </View>
              <View>
                <Text className="text-base font-bold text-dark" style={{ fontFamily: fontFamily.bold }}>Complete Account History</Text>
                <Text className="text-xs text-muted" style={{ fontFamily: fontFamily.medium }}>Compiles all records across all time.</Text>
              </View>
            </View>

            <Text 
              className="text-xs leading-5 text-muted" 
              style={{ fontFamily: fontFamily.medium }}
            >
              All registered transactions, loan contracts, repayments, client ledger summaries, and overall balances will be compiled into a single unified ledger statement.
            </Text>

            <AppButton 
              title="Generate Complete History" 
              icon={History} 
              loading={mutation.isPending} 
              onPress={() => mutation.mutate("complete")} 
            />
          </View>
        ) : null}

        {mutation.isError ? (
          <View className="mt-5 rounded-2xl bg-peach border border-border p-4">
            <Text className="text-xs font-semibold text-danger" style={{ fontFamily: fontFamily.bold }}>
              {getErrorMessage(mutation.error)}
            </Text>
          </View>
        ) : null}
    </Screen>
  );
};
