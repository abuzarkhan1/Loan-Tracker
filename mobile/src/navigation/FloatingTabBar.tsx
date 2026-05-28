import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BarChart3, ContactRound, Home, Landmark, Settings2 } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../providers/ThemeProvider";
import { fontFamily } from "../utils/theme";

const tabMeta = {
  Dashboard: { label: "Home", icon: Home },
  Contacts: { label: "Contacts", icon: ContactRound },
  Loans: { label: "Loans", icon: Landmark },
  Reports: { label: "Reports", icon: BarChart3 },
  Settings: { label: "Settings", icon: Settings2 },
};

export const FloatingTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: Math.max(insets.bottom, 12),
      }}
    >
      <View
        style={[
          {
            minHeight: 70,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.card,
            padding: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
          },
          theme.shadowElevated,
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const meta = tabMeta[route.name as keyof typeof tabMeta];
          const Icon = meta.icon;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.86}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={onPress}
              style={{
                minHeight: 52,
                flex: focused ? 1.55 : 0.86,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: focused ? 8 : 0,
                backgroundColor: focused ? theme.primary : "transparent",
                borderWidth: focused ? 0 : 1,
                borderColor: focused ? "transparent" : theme.border,
              }}
            >
              <Icon color={focused ? theme.white : theme.muted} size={20} />
              {focused ? (
                <Text
                  numberOfLines={1}
                  style={{
                    color: theme.white,
                    fontFamily: fontFamily.extraBold,
                    fontSize: 12,
                  }}
                >
                  {meta.label}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
