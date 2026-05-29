import { zodResolver } from "@hookform/resolvers/zod";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { z } from "zod";
import { api } from "../../api/client";
import { PaymentMethod } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { DatePickerField } from "../../components/DatePickerField";
import { FormInput } from "../../components/FormInput";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { getErrorMessage } from "../../utils/errors";
import { paymentMethodOptions } from "../../utils/finance";
import { formatCurrency, toDateInput } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

const schema = z.object({
  amount: z.string().min(1, "Amount required").refine((value) => Number(value) > 0, "Amount must be greater than 0"),
  salaryDate: z.string().min(1, "Date required"),
  paymentMethod: z.enum(["CASH", "BANK", "JAZZCASH", "EASYPAISA", "OTHER"]),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, "MarkSalaryReceived">;

export const MarkSalaryReceivedScreen = ({ navigation, route }: Props) => {
  const queryClient = useQueryClient();
  const entryQuery = useQuery({ queryKey: ["salary", "entry", route.params.entryId], queryFn: () => api.getSalaryEntry(route.params.entryId) });
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      salaryDate: toDateInput(new Date()),
      paymentMethod: "BANK",
      note: "",
    },
  });

  useEffect(() => {
    if (entryQuery.data) {
      reset({
        amount: String(entryQuery.data.amount),
        salaryDate: toDateInput(entryQuery.data.salaryDate || new Date()),
        paymentMethod: entryQuery.data.paymentMethod,
        note: entryQuery.data.note || "",
      });
    }
  }, [entryQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      api.markSalaryReceived(route.params.entryId, {
        amount: Number(values.amount),
        salaryDate: values.salaryDate,
        paymentMethod: values.paymentMethod as PaymentMethod,
        note: values.note || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["salary"] });
      await queryClient.invalidateQueries({ queryKey: ["finance"] });
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      navigation.goBack();
    },
  });

  if (entryQuery.isLoading) return <Screen><LoadingState label="Loading salary entry..." /></Screen>;
  if (entryQuery.isError) return <Screen><ErrorState message="Salary entry load nahi ho saki." onRetry={entryQuery.refetch} /></Screen>;

  return (
    <Screen className="gap-5 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Mark Salary Received</Text>
        <Text className="mt-1 text-sm font-medium text-muted">
          Expected {formatCurrency(entryQuery.data?.amount || 0)}
        </Text>
      </View>
      <FormInput control={control} name="amount" label="Amount Received" keyboardType="numeric" placeholder="100000" error={errors.amount?.message} />
      <Controller control={control} name="salaryDate" render={({ field: { onChange, value } }) => <DatePickerField label="Received Date" value={value} onChange={onChange} error={errors.salaryDate?.message} />} />
      <Controller control={control} name="paymentMethod" render={({ field: { onChange, value } }) => <FormSelect label="Payment Method" value={value} onChange={onChange} options={paymentMethodOptions} />} />
      <FormInput control={control} name="note" label="Note" placeholder="Optional note" multiline />
      {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}
      <AppButton title="Confirm Salary Received" icon={CheckCircle2} loading={mutation.isPending} onPress={handleSubmit((values) => mutation.mutate(values))} />
    </Screen>
  );
};
