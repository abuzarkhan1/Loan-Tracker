import { Text, TouchableOpacity, View } from "react-native";
import { Loan } from "../api/types";
import { useAppTheme } from "../providers/ThemeProvider";
import { formatCurrency, formatDate, getProgress } from "../utils/format";
import { fontFamily } from "../utils/theme";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";

const getContactName = (loan: Loan) => {
  return typeof loan.contactId === "string" ? "Contact" : loan.contactId?.name || "Contact";
};

export const LoanCard = ({ loan, onPress }: { loan: Loan; onPress: () => void }) => {
  const { theme } = useAppTheme();
  const progress = getProgress(loan.paidAmount, loan.amount);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        {
          borderRadius: 28,
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.card,
          padding: 20,
        },
        theme.shadowSoft,
      ]}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text style={{ color: theme.text, fontFamily: fontFamily.extraBold, fontSize: 17 }}>{getContactName(loan)}</Text>
          <Text style={{ color: theme.muted, fontFamily: fontFamily.semiBold, fontSize: 12, marginTop: 4 }}>{formatDate(loan.issueDate)}</Text>
        </View>
        <View className="items-end gap-2">
          <StatusBadge value={loan.type} />
          <StatusBadge value={loan.status} />
        </View>
      </View>

      <View className="mt-4 gap-2">
        <View className="flex-row justify-between">
          <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 12 }}>Paid {progress}%</Text>
          <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 12 }}>Baqi Raqam {formatCurrency(loan.remainingAmount)}</Text>
        </View>
        <ProgressBar progress={progress} />
      </View>

      <View className="mt-4 flex-row justify-between">
        <Text style={{ color: theme.text, fontFamily: fontFamily.bold, fontSize: 14 }}>{formatCurrency(loan.amount)}</Text>
        <Text style={{ color: theme.success, fontFamily: fontFamily.bold, fontSize: 14 }}>{formatCurrency(loan.paidAmount)}</Text>
      </View>
    </TouchableOpacity>
  );
};
