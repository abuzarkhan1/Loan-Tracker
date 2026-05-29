import { zodResolver } from "@hookform/resolvers/zod";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Switch, Text, View } from "react-native";
import { z } from "zod";
import { api } from "../../api/client";
import { PaymentMethod } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { FormInput } from "../../components/FormInput";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { paymentMethodOptions } from "../../utils/finance";
import { fontFamily } from "../../utils/theme";

const schema = z.object({
  defaultAmount: z.string().min(1, "Salary amount required").refine((value) => Number(value) >= 0, "Invalid amount"),
  salaryDay: z.string().min(1, "Salary day required").refine((value) => Number(value) >= 1 && Number(value) <= 28, "Use day 1-28"),
  cycleStartDay: z.string().min(1, "Cycle start day required").refine((value) => Number(value) >= 1 && Number(value) <= 28, "Use day 1-28"),
  source: z.enum(["JOB", "FREELANCE", "BUSINESS", "OTHER"]),
  paymentMethod: z.enum(["CASH", "BANK", "JAZZCASH", "EASYPAISA", "OTHER"]),
  autoCreateExpectedSalary: z.boolean(),
  reminderEnabled: z.boolean(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const sourceOptions = [
  { label: "Job", value: "JOB" as const },
  { label: "Freelance", value: "FREELANCE" as const },
  { label: "Business", value: "BUSINESS" as const },
  { label: "Other", value: "OTHER" as const },
];

const ToggleRow = ({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) => {
  const { theme } = useAppTheme();
  return (
    <View className="flex-row items-center justify-between rounded-2xl border border-border bg-card p-4" style={theme.shadowSoft}>
      <Text className="text-sm font-black text-dark">{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: theme.border, true: theme.primary }} thumbColor={theme.white} />
    </View>
  );
};

const SalaryProfileForm = ({ navigation }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ["salary", "profile"], queryFn: api.getSalaryProfile });
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      defaultAmount: "",
      salaryDay: "1",
      cycleStartDay: "1",
      source: "JOB",
      paymentMethod: "BANK",
      autoCreateExpectedSalary: true,
      reminderEnabled: false,
      notes: "",
    },
  });

  useEffect(() => {
    if (profileQuery.data) {
      reset({
        defaultAmount: String(profileQuery.data.defaultAmount),
        salaryDay: String(profileQuery.data.salaryDay),
        cycleStartDay: String(profileQuery.data.cycleStartDay),
        source: profileQuery.data.source,
        paymentMethod: profileQuery.data.paymentMethod,
        autoCreateExpectedSalary: profileQuery.data.autoCreateExpectedSalary,
        reminderEnabled: profileQuery.data.reminderEnabled,
        notes: profileQuery.data.notes || "",
      });
    }
  }, [profileQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        defaultAmount: Number(values.defaultAmount),
        frequency: "MONTHLY" as const,
        salaryDay: Number(values.salaryDay),
        cycleStartDay: Number(values.cycleStartDay),
        source: values.source,
        paymentMethod: values.paymentMethod as PaymentMethod,
        autoCreateExpectedSalary: values.autoCreateExpectedSalary,
        reminderEnabled: values.reminderEnabled,
        notes: values.notes || undefined,
      };
      return profileQuery.data ? api.updateSalaryProfile(payload) : api.saveSalaryProfile(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["salary"] });
      await queryClient.invalidateQueries({ queryKey: ["finance"] });
      navigation.goBack();
    },
  });

  return (
    <Screen className="gap-4 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Salary Profile</Text>
        <Text className="mt-1 text-sm font-medium text-muted">
          If salary comes on 25th, cycle can run from 25 May to 24 June.
        </Text>
      </View>
      <FormInput control={control} name="defaultAmount" label="Monthly Salary Amount" keyboardType="numeric" placeholder="100000" error={errors.defaultAmount?.message} />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormInput control={control} name="salaryDay" label="Salary Day" keyboardType="numeric" placeholder="25" error={errors.salaryDay?.message} />
        </View>
        <View className="flex-1">
          <FormInput control={control} name="cycleStartDay" label="Cycle Start" keyboardType="numeric" placeholder="25" error={errors.cycleStartDay?.message} />
        </View>
      </View>
      <Controller control={control} name="source" render={({ field: { onChange, value } }) => <FormSelect label="Source" value={value} onChange={onChange} options={sourceOptions} />} />
      <Controller control={control} name="paymentMethod" render={({ field: { onChange, value } }) => <FormSelect label="Payment Method" value={value} onChange={onChange} options={paymentMethodOptions} />} />
      <ToggleRow label="Auto create expected salary" value={watch("autoCreateExpectedSalary")} onValueChange={(value) => setValue("autoCreateExpectedSalary", value)} />
      <ToggleRow label="Salary reminder" value={watch("reminderEnabled")} onValueChange={(value) => setValue("reminderEnabled", value)} />
      <FormInput control={control} name="notes" label="Notes" placeholder="Optional" multiline />
      {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}
      <AppButton title="Save Salary Profile" icon={Save} loading={mutation.isPending} onPress={handleSubmit((values) => mutation.mutate(values))} />
    </Screen>
  );
};

export const SalarySetupScreen = (props: Props) => <SalaryProfileForm {...props} />;
export const SalarySettingsScreen = (props: Props) => <SalaryProfileForm {...props} />;
