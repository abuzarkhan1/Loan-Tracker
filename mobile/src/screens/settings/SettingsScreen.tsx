import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit3, LogOut, Mail, Moon, Palette, Save, Sun, UserRound } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Text, TouchableOpacity, View } from "react-native";
import { z } from "zod";
import { AppButton } from "../../components/AppButton";
import { FormInput } from "../../components/FormInput";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../providers/AuthProvider";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { fontFamily, ThemeMode } from "../../utils/theme";

const profileSchema = z.object({
  name: z.string().min(2, "Name required").max(80),
  email: z.string().email("Valid email required"),
});

type ProfileValues = z.infer<typeof profileSchema>;

export const SettingsScreen = () => {
  const { user, logout, updateProfile } = useAuth();
  const { mode, theme, setMode } = useAppTheme();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  useEffect(() => {
    reset({
      name: user?.name || "",
      email: user?.email || "",
    });
  }, [reset, user]);

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      setIsEditing(false);
    },
  });

  const handleLogout = async () => {
    queryClient.clear();
    await logout();
  };

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Settings</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Profile, theme, aur app customization.</Text>
      </View>

      <View className="mt-6 gap-5 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-row flex-1 items-center gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-lg bg-peach">
              <UserRound color={theme.primaryDark} size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-dark">{user?.name || "User"}</Text>
              <Text className="mt-1 text-sm font-medium text-muted">{user?.email}</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setIsEditing((value) => !value)}
            style={{
              height: 40,
              width: 40,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.backgroundSoft,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Edit3 color={theme.primary} size={18} />
          </TouchableOpacity>
        </View>

        <View className="h-px bg-border" />

        {isEditing ? (
          <View className="gap-4">
            <FormInput control={control} name="name" label="Name" placeholder="Your name" error={errors.name?.message} />
            <FormInput
              control={control}
              name="email"
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              error={errors.email?.message}
            />
            {profileMutation.isError ? (
              <Text className="text-sm font-semibold text-danger">{getErrorMessage(profileMutation.error)}</Text>
            ) : null}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <AppButton
                  title="Cancel"
                  variant="secondary"
                  onPress={() => {
                    reset({ name: user?.name || "", email: user?.email || "" });
                    setIsEditing(false);
                  }}
                />
              </View>
              <View className="flex-1">
                <AppButton
                  title="Save"
                  icon={Save}
                  loading={profileMutation.isPending}
                  onPress={handleSubmit((values) => profileMutation.mutate(values))}
                />
              </View>
            </View>
          </View>
        ) : (
          <View className="gap-4">
            <View className="flex-row items-center gap-4">
              <View className="h-11 w-11 items-center justify-center rounded-lg bg-background-soft">
                <UserRound color={theme.primary} size={21} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold uppercase text-muted">Full Name</Text>
                <Text className="mt-1 text-base font-bold text-dark">{user?.name || "Not set"}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-4">
              <View className="h-11 w-11 items-center justify-center rounded-lg bg-background-soft">
                <Mail color={theme.primary} size={21} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold uppercase text-muted">Email</Text>
                <Text className="mt-1 text-base font-bold text-dark">{user?.email || "Not set"}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <View className="mt-5 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-lg bg-yellow">
            <Palette color={theme.warning} size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-dark">Appearance</Text>
            <Text className="mt-1 text-sm font-medium text-muted">Design.html wali peach light aur warm dark theme.</Text>
          </View>
        </View>

        <View
          className="mt-4 flex-row self-start"
          style={{
            gap: 10,
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 999,
            padding: 6,
          }}
        >
          {([
            { value: "light" as ThemeMode, label: "Light", icon: Sun },
            { value: "dark" as ThemeMode, label: "Dark", icon: Moon },
          ]).map((option) => {
            const active = mode === option.value;
            const Icon = option.icon;
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.85}
                onPress={() => void setMode(option.value)}
                style={{
                  minHeight: 38,
                  borderRadius: 999,
                  paddingHorizontal: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                  backgroundColor: active ? theme.primary : "transparent",
                  shadowColor: active ? theme.primary : "transparent",
                  shadowOpacity: active ? 0.3 : 0,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 4 },
                }}
              >
                <Icon color={active ? theme.white : theme.muted} size={16} />
                <Text
                  style={{
                    color: active ? theme.white : theme.muted,
                    fontFamily: fontFamily.bold,
                    fontSize: 13,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View className="mt-6">
        <AppButton title="Logout" icon={LogOut} variant="danger" onPress={handleLogout} />
      </View>
    </Screen>
  );
};
