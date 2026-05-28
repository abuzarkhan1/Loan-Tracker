import DateTimePicker, { DateTimePickerChangeEvent } from "@react-native-community/datetimepicker";
import { CalendarDays } from "lucide-react-native";
import { useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../providers/ThemeProvider";
import { formatDate, toDateInput } from "../utils/format";
import { fontFamily } from "../utils/theme";

type DatePickerFieldProps = {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
};

export const DatePickerField = ({
  label,
  value,
  onChange,
  error,
  minimumDate,
  maximumDate,
}: DatePickerFieldProps) => {
  const { theme } = useAppTheme();
  const [open, setOpen] = useState(false);
  const selectedDate = value ? new Date(value) : new Date();

  const handleValueChange = (_event: DateTimePickerChangeEvent, nextDate: Date) => {
    if (Platform.OS === "android") {
      setOpen(false);
    }

    onChange(toDateInput(nextDate));
  };

  const handleDismiss = () => {
    setOpen(false);
  };

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setOpen(true)}
        style={[
          {
            minHeight: 50,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: error ? theme.danger : theme.border,
            backgroundColor: theme.input,
            paddingHorizontal: 18,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          },
          open ? { shadowColor: theme.primary, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 2 } : null,
        ]}
      >
        <Text style={{ color: value ? theme.text : theme.placeholder, fontFamily: fontFamily.semiBold, fontSize: 15 }}>
          {value ? formatDate(value) : "Select date"}
        </Text>
        <View
          style={{
            height: 34,
            width: 34,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.peach,
          }}
        >
          <CalendarDays color={theme.primaryDark} size={18} />
        </View>
      </TouchableOpacity>
      {error ? <Text style={{ color: theme.danger, fontFamily: fontFamily.semiBold, fontSize: 12 }}>{error}</Text> : null}

      {open ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "calendar"}
          onValueChange={handleValueChange}
          onDismiss={handleDismiss}
          onNeutralButtonPress={handleDismiss}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          accentColor={theme.primary}
          themeVariant={theme.mode}
        />
      ) : null}
    </View>
  );
};
