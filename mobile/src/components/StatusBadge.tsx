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
};

export const StatusBadge = ({ value }: { value: LoanStatus | LoanType }) => {
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
      <Text style={{ color, fontFamily: fontFamily.extraBold, fontSize: 11 }}>{labels[value]}</Text>
    </View>
  );
};
