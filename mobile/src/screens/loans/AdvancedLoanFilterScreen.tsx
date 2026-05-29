import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react-native";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { DatePickerField } from "../../components/DatePickerField";
import { AppButton } from "../../components/AppButton";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { RootStackParamList, LoanFilterParams } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "AdvancedLoanFilters">;

const paymentMethods = [
  { label: "Any", value: "ALL" },
  { label: "Cash", value: "CASH" },
  { label: "Bank", value: "BANK" },
  { label: "JazzCash", value: "JAZZCASH" },
  { label: "EasyPaisa", value: "EASYPAISA" },
  { label: "Other", value: "OTHER" },
];

const sortOptions = [
  { label: "Issue Date", value: "issueDate" },
  { label: "Due Date", value: "dueDate" },
  { label: "Amount", value: "amount" },
  { label: "Remaining", value: "remainingAmount" },
];

const FilterTextInput = ({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value?: string;
  onChangeText: (value: string) => void;
}) => {
  const { theme } = useAppTheme();
  return (
    <View className="flex-1">
      <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value || ""}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={theme.placeholder}
        style={{
          minHeight: 50,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.input,
          color: theme.text,
          fontFamily: fontFamily.semiBold,
          fontSize: 15,
          paddingHorizontal: 18,
        }}
      />
    </View>
  );
};

export const AdvancedLoanFilterScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const [filters, setFilters] = useState<LoanFilterParams>(route.params?.filters || {});
  const contactsQuery = useQuery({
    queryKey: ["contacts", "loan-filter"],
    queryFn: () => api.getContacts({ page: 1, limit: 50 }),
  });

  const update = (patch: LoanFilterParams) => setFilters((current) => ({ ...current, ...patch }));
  const reset = () => setFilters({});

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Advanced Filters</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Amount, date, proof aur payment method se filter karein.</Text>
      </View>

      <View className="mt-6 gap-5 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row gap-3">
          <FilterTextInput label="Min amount" value={filters.minAmount} onChangeText={(value) => update({ minAmount: value })} />
          <FilterTextInput label="Max amount" value={filters.maxAmount} onChangeText={(value) => update({ maxAmount: value })} />
        </View>

        <View className="gap-3">
          <Text style={{ color: theme.text, fontFamily: fontFamily.bold, fontSize: 15 }}>Issue Date Range</Text>
          <DatePickerField label="From" value={filters.issueDateFrom} onChange={(value) => update({ issueDateFrom: value })} />
          <DatePickerField label="To" value={filters.issueDateTo} onChange={(value) => update({ issueDateTo: value })} />
        </View>

        <View className="gap-3">
          <Text style={{ color: theme.text, fontFamily: fontFamily.bold, fontSize: 15 }}>Due Date Range</Text>
          <DatePickerField label="From" value={filters.dueDateFrom} onChange={(value) => update({ dueDateFrom: value })} />
          <DatePickerField label="To" value={filters.dueDateTo} onChange={(value) => update({ dueDateTo: value })} />
        </View>

        <FormSelect
          label="Payment Method"
          value={(filters.paymentMethod || "ALL") as never}
          onChange={(value) => update({ paymentMethod: value === "ALL" ? undefined : value })}
          options={paymentMethods as never}
        />

        <FormSelect
          label="Has Proof"
          value={filters.hasProof === undefined ? "ALL" : filters.hasProof ? "YES" : "NO"}
          onChange={(value) => update({ hasProof: value === "ALL" ? undefined : value === "YES" })}
          options={[
            { label: "Any", value: "ALL" },
            { label: "With proof", value: "YES" },
            { label: "No proof", value: "NO" },
          ]}
        />

        <FormSelect
          label="Sort By"
          value={(filters.sortBy || "issueDate") as never}
          onChange={(value) => update({ sortBy: value })}
          options={sortOptions as never}
        />

        <FormSelect
          label="Sort Order"
          value={filters.sortOrder || "desc"}
          onChange={(value) => update({ sortOrder: value })}
          options={[
            { label: "Newest / High", value: "desc" },
            { label: "Oldest / Low", value: "asc" },
          ]}
        />
      </View>

      <View className="mt-5 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <Text className="text-base font-bold text-dark">Contact</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => update({ contactId: undefined })}
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: !filters.contactId ? theme.primary : theme.border,
              backgroundColor: !filters.contactId ? theme.primary : theme.pill,
              paddingHorizontal: 14,
              paddingVertical: 9,
            }}
          >
            <Text style={{ color: !filters.contactId ? theme.white : theme.muted, fontFamily: fontFamily.bold, fontSize: 12 }}>All</Text>
          </TouchableOpacity>
          {(contactsQuery.data?.contacts || []).map((contact) => {
            const selected = filters.contactId === contact._id;
            return (
              <TouchableOpacity
                key={contact._id}
                activeOpacity={0.85}
                onPress={() => update({ contactId: contact._id })}
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
      </View>

      <View className="mt-6 flex-row gap-3">
        <View className="flex-1">
          <AppButton title="Reset" icon={X} variant="secondary" onPress={reset} />
        </View>
        <View className="flex-1">
          <AppButton
            title="Apply"
            icon={SlidersHorizontal}
            onPress={() => navigation.navigate("MainTabs", { screen: "Loans", params: { filters } })}
          />
        </View>
      </View>
    </Screen>
  );
};
