import { Delete } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../providers/ThemeProvider";
import { fontFamily } from "../utils/theme";

type PinKeypadProps = {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
};

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "delete"];

export const PinKeypad = ({ value, onChange, maxLength = 4 }: PinKeypadProps) => {
  const { theme } = useAppTheme();

  const pressKey = (key: string) => {
    if (!key) return;
    if (key === "delete") {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length < maxLength) {
      onChange(`${value}${key}`);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <View className="flex-row justify-center gap-3">
        {Array.from({ length: maxLength }).map((_, index) => (
          <View
            key={index}
            style={{
              height: 13,
              width: 13,
              borderRadius: 999,
              backgroundColor: index < value.length ? theme.primary : theme.border,
            }}
          />
        ))}
      </View>

      <View className="flex-row flex-wrap justify-center" style={{ gap: 12 }}>
        {keys.map((key, index) => (
          <TouchableOpacity
            key={`${key}-${index}`}
            activeOpacity={key ? 0.85 : 1}
            disabled={!key}
            onPress={() => pressKey(key)}
            style={{
              height: 68,
              width: 68,
              borderRadius: 24,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: key ? theme.card : "transparent",
              borderWidth: key ? 1 : 0,
              borderColor: theme.border,
            }}
          >
            {key === "delete" ? (
              <Delete color={theme.muted} size={22} />
            ) : (
              <Text style={{ color: theme.text, fontFamily: fontFamily.extraBold, fontSize: 24 }}>{key}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
