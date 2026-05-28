import { Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../providers/ThemeProvider";
import { fontFamily } from "../utils/theme";

type Option<T extends string> = {
  label: string;
  value: T;
};

type FormSelectProps<T extends string> = {
  label: string;
  value?: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  error?: string;
};

export const FormSelect = <T extends string>({ label, value, options, onChange, error }: FormSelectProps<T>) => {
  const { theme } = useAppTheme();

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              activeOpacity={0.85}
              onPress={() => onChange(option.value)}
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: selected ? theme.primary : theme.border,
                backgroundColor: selected ? theme.primary : theme.pill,
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: selected ? theme.white : theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? <Text style={{ color: theme.danger, fontFamily: fontFamily.semiBold, fontSize: 12 }}>{error}</Text> : null}
    </View>
  );
};
