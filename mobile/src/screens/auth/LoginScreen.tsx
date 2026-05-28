import { zodResolver } from "@hookform/resolvers/zod";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Text, TouchableOpacity, View } from "react-native";
import { z } from "zod";
import { AuthStackParamList } from "../../navigation/types";
import { useAuth } from "../../providers/AuthProvider";
import { useAppTheme } from "../../providers/ThemeProvider";
import { AppButton } from "../../components/AppButton";
import { BrandLogo } from "../../components/BrandLogo";
import { FormInput } from "../../components/FormInput";
import { Screen } from "../../components/Screen";
import { getErrorMessage } from "../../utils/errors";

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});

type FormValues = z.infer<typeof schema>;
type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export const LoginScreen = ({ navigation }: Props) => {
  const { login } = useAuth();
  const { theme } = useAppTheme();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: login,
  });

  return (
    <Screen className="justify-center pt-16">
      <View className="mb-10 items-center gap-4">
        <BrandLogo size={72} />
        <View className="items-center">
          <Text className="text-3xl font-black text-dark">Loan Tracker</Text>
          <Text className="mt-2 text-center text-sm font-medium text-muted">
            Raqam, contacts, aur payments ek jagah.
          </Text>
        </View>
      </View>

      <View className="gap-4 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <FormInput
          control={control}
          name="email"
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          error={errors.email?.message}
        />
        <FormInput
          control={control}
          name="password"
          label="Password"
          secureTextEntry
          placeholder="Password"
          error={errors.password?.message}
        />
        {mutation.isError ? (
          <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text>
        ) : null}
        <AppButton title="Login" onPress={handleSubmit((values) => mutation.mutate(values))} loading={mutation.isPending} />
      </View>

      <TouchableOpacity className="mt-6 items-center" onPress={() => navigation.navigate("Register")}>
        <Text className="text-sm font-semibold text-muted">
          New here? <Text style={{ color: theme.primary }}>Create account</Text>
        </Text>
      </TouchableOpacity>
    </Screen>
  );
};
