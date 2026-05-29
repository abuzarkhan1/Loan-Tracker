import { zodResolver } from "@hookform/resolvers/zod";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { z } from "zod";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { DatePickerField } from "../../components/DatePickerField";
import { FormInput } from "../../components/FormInput";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { getErrorMessage } from "../../utils/errors";
import { formatCurrency, formatDate, toDateInput } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

const schema = z.object({
  amount: z.string().min(1, "Amount required").refine((value) => Number(value) > 0, "Amount must be greater than 0"),
  date: z.string().min(1, "Date required"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, "AddSavingsProgress">;

export const AddSavingsProgressScreen = ({ navigation, route }: Props) => {
  const queryClient = useQueryClient();
  const goalQuery = useQuery({ queryKey: ["savings-goal", route.params.goalId], queryFn: () => api.getSavingsGoal(route.params.goalId) });
  const progressQuery = useQuery({
    queryKey: ["savings-goal", route.params.goalId, "progress"],
    queryFn: () => api.getSavingsGoalProgress(route.params.goalId, { limit: 5 }),
  });
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "", date: toDateInput(new Date()), note: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      api.addSavingsProgress(route.params.goalId, {
        amount: Number(values.amount),
        date: values.date,
        note: values.note || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      await queryClient.invalidateQueries({ queryKey: ["savings-goal", route.params.goalId] });
      await queryClient.invalidateQueries({ queryKey: ["finance"] });
      await queryClient.invalidateQueries({ queryKey: ["salary", "allocation"] });
      navigation.goBack();
    },
  });

  if (goalQuery.isLoading) return <Screen><LoadingState label="Loading savings goal..." /></Screen>;
  if (goalQuery.isError) return <Screen><ErrorState message="Savings goal load nahi ho saka." onRetry={goalQuery.refetch} /></Screen>;

  const goal = goalQuery.data;

  return (
    <Screen className="gap-5 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Add Savings Progress</Text>
        <Text className="mt-1 text-sm font-medium text-muted">
          {goal?.name} · {formatCurrency(goal?.currentAmount || 0)} saved
        </Text>
      </View>
      <FormInput control={control} name="amount" label="Amount" keyboardType="numeric" placeholder="5000" error={errors.amount?.message} />
      <Controller control={control} name="date" render={({ field: { onChange, value } }) => <DatePickerField label="Date" value={value} onChange={onChange} error={errors.date?.message} />} />
      <FormInput control={control} name="note" label="Note" placeholder="Optional note" multiline />
      {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}
      <AppButton title="Add Progress" icon={CircleDollarSign} loading={mutation.isPending} onPress={handleSubmit((values) => mutation.mutate(values))} />

      {progressQuery.data?.progress.length ? (
        <View className="gap-3">
          <Text className="text-base font-black text-dark">Recent Progress</Text>
          {progressQuery.data.progress.map((item) => (
            <View key={item._id} className="rounded-2xl border border-border bg-card p-4">
              <Text className="text-sm font-black text-dark">{formatCurrency(item.amount)}</Text>
              <Text className="mt-1 text-xs font-semibold text-muted">{formatDate(item.date)}{item.note ? ` · ${item.note}` : ""}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
};
