import { Image, View } from "react-native";
import { useAppTheme } from "../providers/ThemeProvider";

type BrandLogoProps = {
  size?: number;
  elevated?: boolean;
};

export const BrandLogo = ({ size = 64, elevated = true }: BrandLogoProps) => {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.24),
          backgroundColor: theme.card,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderWidth: 1,
          borderColor: theme.border,
        },
        elevated ? theme.shadowSoft : null,
      ]}
    >
      <Image
        source={require("../../assets/logo.png")}
        resizeMode="contain"
        style={{
          width: size,
          height: size,
        }}
      />
    </View>
  );
};
