import DateTimePicker, { DateTimePickerChangeEvent } from "@react-native-community/datetimepicker";
import { Clock3 } from "lucide-react-native";
import { useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../providers/ThemeProvider";
import { fontFamily } from "../utils/theme";

type TimePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

const timeToDate = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(Number.isFinite(hours) ? hours : 20, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return date;
};

const dateToTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

export const TimePickerField = ({ label, value, onChange, error }: TimePickerFieldProps) => {
  const { theme } = useAppTheme();
  const [open, setOpen] = useState(false);

  const handleValueChange = (_event: DateTimePickerChangeEvent, nextDate: Date) => {
    if (Platform.OS === "android") {
      setOpen(false);
    }

    onChange(dateToTime(nextDate));
  };

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setOpen(true)}
        style={{
          minHeight: 50,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: error ? theme.danger : theme.border,
          backgroundColor: theme.input,
          paddingHorizontal: 18,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: theme.text, fontFamily: fontFamily.semiBold, fontSize: 15 }}>{value}</Text>
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
          <Clock3 color={theme.primaryDark} size={18} />
        </View>
      </TouchableOpacity>
      {error ? <Text style={{ color: theme.danger, fontFamily: fontFamily.semiBold, fontSize: 12 }}>{error}</Text> : null}

      {open ? (
        <DateTimePicker
          value={timeToDate(value)}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "clock"}
          onValueChange={handleValueChange}
          onDismiss={() => setOpen(false)}
          onNeutralButtonPress={() => setOpen(false)}
          accentColor={theme.primary}
          themeVariant={theme.mode}
        />
      ) : null}
    </View>
  );
};
