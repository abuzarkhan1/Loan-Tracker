import { zodResolver } from "@hookform/resolvers/zod";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Save, XCircle } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { z } from "zod";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { DatePickerField } from "../../components/DatePickerField";
import { FormInput } from "../../components/FormInput";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { getErrorMessage } from "../../utils/errors";
import { paymentMethodOptions } from "../../utils/finance";
import { toDateInput } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

const schema = z.object({
  amount: z.string().min(1, "Amount required").refine((value) => Number(value) > 0, "Invalid amount"),
  source: z.enum(["JOB", "FREELANCE", "BUSINESS", "OTHER"]),
  paymentMethod: z.enum(["CASH", "BANK", "JAZZCASH", "EASYPAISA", "OTHER"]),
  salaryDate: z.string().min(1, "Salary date required"),
  status: z.enum(["EXPECTED", "RECEIVED", "MISSED"]),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, "SalaryEntryDetail">;

export const SalaryEntryDetailScreen = ({ navigation, route }: Props) => {
  const queryClient = useQueryClient();
  const entryId = route.params?.entryId;
  const entryQuery = useQuery({ queryKey: ["salary", "entry", entryId], queryFn: () => api.getSalaryEntry(entryId!), enabled: Boolean(entryId) });
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "", source: "JOB", paymentMethod: "BANK", salaryDate: toDateInput(new Date()), status: "EXPECTED", note: "" },
  });

  useEffect(() => {
    if (entryQuery.data) {
      reset({
        amount: String(entryQuery.data.amount),
        source: entryQuery.data.source,
        paymentMethod: entryQuery.data.paymentMethod,
        salaryDate: toDateInput(entryQuery.data.salaryDate),
        status: entryQuery.data.status,
        note: entryQuery.data.note || "",
      });
    }
  }, [entryQuery.data, reset]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["salary"] });
    await queryClient.invalidateQueries({ queryKey: ["finance"] });
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };
  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, amount: Number(values.amount), note: values.note || undefined };
      return entryId ? api.updateSalaryEntry(entryId, payload) : api.createSalaryEntry(payload);
    },
    onSuccess: async () => {
      await invalidate();
      navigation.goBack();
    },
  });
  const markReceivedMutation = useMutation({ mutationFn: () => api.markSalaryReceived(entryId!), onSuccess: invalidate });
  const markMissedMutation = useMutation({ mutationFn: () => api.markSalaryMissed(entryId!), onSuccess: invalidate });

  if (entryQuery.isLoading) return <Screen><LoadingState label="Loading salary entry..." /></Screen>;

  return (
    <Screen className="gap-4 pt-5">
      <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>{entryId ? "Salary Entry" : "Add Salary Entry"}</Text>
      <FormInput control={control} name="amount" label="Amount" keyboardType="numeric" placeholder="100000" error={errors.amount?.message} />
      <Controller control={control} name="source" render={({ field: { onChange, value } }) => <FormSelect label="Source" value={value} onChange={onChange} options={[{ label: "Job", value: "JOB" }, { label: "Freelance", value: "FREELANCE" }, { label: "Business", value: "BUSINESS" }, { label: "Other", value: "OTHER" }]} />} />
      <Controller control={control} name="paymentMethod" render={({ field: { onChange, value } }) => <FormSelect label="Payment Method" value={value} onChange={onChange} options={paymentMethodOptions} />} />
      <Controller control={control} name="salaryDate" render={({ field: { onChange, value } }) => <DatePickerField label="Salary Date" value={value} onChange={onChange} error={errors.salaryDate?.message} />} />
      <Controller control={control} name="status" render={({ field: { onChange, value } }) => <FormSelect label="Status" value={value} onChange={onChange} options={[{ label: "Expected", value: "EXPECTED" }, { label: "Received", value: "RECEIVED" }, { label: "Missed", value: "MISSED" }]} />} />
      <FormInput control={control} name="note" label="Note" placeholder="Optional" multiline />
      {(saveMutation.isError || markReceivedMutation.isError || markMissedMutation.isError) ? (
        <Text className="text-sm font-semibold text-danger">{getErrorMessage(saveMutation.error || markReceivedMutation.error || markMissedMutation.error)}</Text>
      ) : null}
      <AppButton title="Save Entry" icon={Save} loading={saveMutation.isPending} onPress={handleSubmit((values) => saveMutation.mutate(values))} />
      {entryId ? (
        <View className="flex-row gap-3">
          <View className="flex-1"><AppButton title="Received" icon={CheckCircle2} variant="secondary" loading={markReceivedMutation.isPending} onPress={() => navigation.navigate("MarkSalaryReceived", { entryId })} /></View>
          <View className="flex-1"><AppButton title="Missed" icon={XCircle} variant="secondary" loading={markMissedMutation.isPending} onPress={() => markMissedMutation.mutate()} /></View>
        </View>
      ) : null}
    </Screen>
  );
};
