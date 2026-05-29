import { zodResolver } from "@hookform/resolvers/zod";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text } from "react-native";
import { z } from "zod";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { DatePickerField } from "../../components/DatePickerField";
import { FormInput } from "../../components/FormInput";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";
import { getErrorMessage } from "../../utils/errors";
import { toDateInput } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  targetAmount: z.string().min(1, "Target required").refine((value) => Number(value) > 0, "Invalid amount"),
  currentAmount: z.string().optional(),
  monthlyTarget: z.string().optional(),
  deadline: z.string().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED"]),
});

type FormValues = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, "AddEditSavingsGoal">;

export const AddEditSavingsGoalScreen = ({ navigation, route }: Props) => {
  const queryClient = useQueryClient();
  const goalId = route.params?.goalId;
  const goalQuery = useQuery({ queryKey: ["savings-goal", goalId], queryFn: () => api.getSavingsGoal(goalId!), enabled: Boolean(goalId) });
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", targetAmount: "", currentAmount: "0", monthlyTarget: "", deadline: "", status: "ACTIVE" },
  });

  useEffect(() => {
    if (goalQuery.data) {
      reset({
        name: goalQuery.data.name,
        targetAmount: String(goalQuery.data.targetAmount),
        currentAmount: String(goalQuery.data.currentAmount),
        monthlyTarget: goalQuery.data.monthlyTarget ? String(goalQuery.data.monthlyTarget) : "",
        deadline: toDateInput(goalQuery.data.deadline),
        status: goalQuery.data.status,
      });
    }
  }, [goalQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        name: values.name,
        targetAmount: Number(values.targetAmount),
        currentAmount: values.currentAmount ? Number(values.currentAmount) : 0,
        monthlyTarget: values.monthlyTarget ? Number(values.monthlyTarget) : undefined,
        deadline: values.deadline || undefined,
        status: values.status,
      };
      return goalId ? api.updateSavingsGoal(goalId, payload) : api.createSavingsGoal(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      await queryClient.invalidateQueries({ queryKey: ["finance"] });
      navigation.goBack();
    },
  });

  return (
    <Screen className="gap-4 pt-5">
      <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>{goalId ? "Edit Savings Goal" : "Add Savings Goal"}</Text>
      <FormInput control={control} name="name" label="Goal Name" placeholder="Emergency fund" error={errors.name?.message} />
      <FormInput control={control} name="targetAmount" label="Target Amount" keyboardType="numeric" placeholder="200000" error={errors.targetAmount?.message} />
      <FormInput control={control} name="currentAmount" label="Current Amount" keyboardType="numeric" placeholder="0" />
      <FormInput control={control} name="monthlyTarget" label="Monthly Target" keyboardType="numeric" placeholder="Optional" />
      <Controller control={control} name="deadline" render={({ field: { onChange, value } }) => <DatePickerField label="Deadline" value={value} onChange={onChange} />} />
      <Controller control={control} name="status" render={({ field: { onChange, value } }) => <FormSelect label="Status" value={value} onChange={onChange} options={[{ label: "Active", value: "ACTIVE" }, { label: "Paused", value: "PAUSED" }, { label: "Completed", value: "COMPLETED" }]} />} />
      {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}
      <AppButton title="Save Goal" icon={Save} loading={mutation.isPending} onPress={handleSubmit((values) => mutation.mutate(values))} />
    </Screen>
  );
};
