import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react-native";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { DatePickerField } from "../../components/DatePickerField";
import { FormInput } from "../../components/FormInput";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "CreateEditGoal">;
type FormValues = { name: string; type: string; targetAmount: string; currentAmount: string; monthlyTarget?: string; deadline?: string; priority: "LOW" | "MEDIUM" | "HIGH" };

export const CreateEditGoalScreen = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const queryClient = useQueryClient();
  const goalId = route.params?.goalId;
  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: { name: "", type: "CUSTOM", targetAmount: "", currentAmount: "0", monthlyTarget: "", deadline: new Date().toISOString(), priority: "MEDIUM" },
  });
  const goalQuery = useQuery({ queryKey: ["goal", goalId], queryFn: () => api.getSavingsGoal(goalId!), enabled: Boolean(goalId) });
  useEffect(() => {
    const goal = goalQuery.data;
    if (!goal) return;
    setValue("name", goal.name);
    setValue("type", goal.type || "CUSTOM");
    setValue("targetAmount", String(goal.targetAmount));
    setValue("currentAmount", String(goal.currentAmount));
    setValue("monthlyTarget", String(goal.monthlyTarget || ""));
    setValue("deadline", goal.deadline || new Date().toISOString());
    setValue("priority", goal.priority || "MEDIUM");
  }, [goalQuery.data, setValue]);
  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => goalId ? api.updateSavingsGoal(goalId, payload) : api.createSavingsGoal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals-planner"] });
      navigation.goBack();
    },
  });
  const submit = handleSubmit((values) => mutation.mutate({
    ...values,
    targetAmount: Number(values.targetAmount),
    currentAmount: Number(values.currentAmount || 0),
    monthlyTarget: values.monthlyTarget ? Number(values.monthlyTarget) : undefined,
  }));
  return (
    <Screen className="gap-4 pt-5">
      <FormInput control={control} name="name" label="Goal name" placeholder="Emergency fund" />
      <FormSelect label="Type" value={watch("type")} onChange={(value) => setValue("type", value)} options={[
        { label: "Emergency", value: "EMERGENCY_FUND" },
        { label: "Laptop", value: "BUY_LAPTOP" },
        { label: "Education", value: "EDUCATION" },
        { label: "Custom", value: "CUSTOM" },
      ]} />
      <FormInput control={control} name="targetAmount" label="Target amount" keyboardType="numeric" />
      <FormInput control={control} name="currentAmount" label="Current amount" keyboardType="numeric" />
      <FormInput control={control} name="monthlyTarget" label="Monthly target" keyboardType="numeric" />
      <DatePickerField label="Deadline" value={watch("deadline") || new Date().toISOString()} onChange={(value) => setValue("deadline", value)} />
      <FormSelect label="Priority" value={watch("priority")} onChange={(value) => setValue("priority", value)} options={[{ label: "Low", value: "LOW" }, { label: "Medium", value: "MEDIUM" }, { label: "High", value: "HIGH" }]} />
      <AppButton title="Save Goal" icon={Save} loading={mutation.isPending} onPress={submit} />
    </Screen>
  );
};
