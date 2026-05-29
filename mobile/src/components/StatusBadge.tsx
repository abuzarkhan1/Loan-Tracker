import { Text, View } from "react-native";
import { LoanStatus, LoanType } from "../api/types";
import { useAppTheme } from "../providers/ThemeProvider";
import { fontFamily } from "../utils/theme";

const labels: Record<string, string> = {
  ACTIVE: "Active",
  PARTIALLY_PAID: "Partial",
  COMPLETED: "Completed",
  OVERDUE: "Overdue",
  GIVEN: "Mujhe Lene Hain",
  TAKEN: "Mujhe Dene Hain",
  PENDING: "Pending",
  PROCESSING: "Processing",
  GENERATED: "Generated",
  FAILED: "Failed",
  DEFAULT: "Default",
  QUEUED: "Queued",
  SENT: "Sent",
  CREATED: "Created",
  SHARED: "Shared",
  EMAIL_SENT: "Email Sent",
  CANCELLED: "Cancelled",
  PAID: "Paid",
  KEPT: "Kept",
  BROKEN: "Broken",
  SETTLED: "Settled",
};

export const StatusBadge = ({ value }: { value: LoanStatus | LoanType | string }) => {
  const { theme } = useAppTheme();
  const isType = value === "GIVEN" || value === "TAKEN";
  const backgroundColor =
    value === "COMPLETED" || value === "GIVEN" ? theme.mint : value === "PARTIALLY_PAID" ? theme.yellow : theme.peach;
  const color =
    value === "COMPLETED" || value === "GIVEN" ? theme.success : value === "PARTIALLY_PAID" ? theme.warning : theme.primaryDark;

  return (
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: isType ? 12 : 10,
        paddingVertical: 4,
        backgroundColor,
        borderWidth: theme.mode === "dark" ? 1 : 0,
        borderColor: theme.border,
      }}
    >
      <Text style={{ color, fontFamily: fontFamily.extraBold, fontSize: 11 }}>{labels[value] || value}</Text>
    </View>
  );
};
