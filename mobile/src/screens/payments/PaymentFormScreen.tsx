import { zodResolver } from "@hookform/resolvers/zod";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react-native";
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
import { LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { getErrorMessage } from "../../utils/errors";
import { formatCurrency, toDateInput } from "../../utils/format";

const schema = z.object({
  amount: z.string().min(1, "Amount required").refine((value) => Number(value) > 0, "Amount must be greater than 0"),
  method: z.enum(["CASH", "BANK", "JAZZCASH", "EASYPAISA", "OTHER"]),
  paymentDate: z.string().optional(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, "PaymentForm">;

const methodOptions: { label: string; value: PaymentMethod }[] = [
  { label: "Cash", value: "CASH" },
  { label: "Bank", value: "BANK" },
  { label: "JazzCash", value: "JAZZCASH" },
  { label: "EasyPaisa", value: "EASYPAISA" },
  { label: "Other", value: "OTHER" },
];

export const PaymentFormScreen = ({ navigation, route }: Props) => {
  const { loanId, paymentId } = route.params;
  const isEditing = Boolean(paymentId);
  const queryClient = useQueryClient();

  const loanQuery = useQuery({
    queryKey: ["loan", loanId],
    queryFn: () => api.getLoan(loanId),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      method: "CASH",
      paymentDate: toDateInput(new Date()),
      note: "",
    },
  });

  const existingPayment = loanQuery.data?.payments.find((payment) => payment._id === paymentId);

  useEffect(() => {
    if (existingPayment) {
      reset({
        amount: String(existingPayment.amount),
        method: existingPayment.method,
        paymentDate: toDateInput(existingPayment.paymentDate),
        note: existingPayment.note || "",
      });
    }
  }, [existingPayment, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        loanId,
        amount: Number(values.amount),
        method: values.method as PaymentMethod,
        paymentDate: values.paymentDate || undefined,
        note: values.note || undefined,
      };

      return isEditing ? api.updatePayment(paymentId!, payload) : api.addPayment(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["loan", loanId] });
      await queryClient.invalidateQueries({ queryKey: ["loans"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigation.goBack();
    },
  });

  if (loanQuery.isLoading) return <Screen><LoadingState label="Loading loan..." /></Screen>;

  const loan = loanQuery.data?.loan;
  const existingAmount = existingPayment?.amount || 0;
  const availableAmount = (loan?.remainingAmount || 0) + (isEditing ? existingAmount : 0);
  const paymentLabel = loan?.type === "TAKEN" ? "Maine diya" : "Wapis mila";

  return (
    <Screen className="gap-4 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">{isEditing ? "Edit Payment" : "Nayi Payment"}</Text>
        <Text className="mt-1 text-sm font-medium text-muted">
          {paymentLabel} · Available: {formatCurrency(availableAmount)}
        </Text>
      </View>

      <FormInput control={control} name="amount" label={`${paymentLabel} amount`} keyboardType="numeric" placeholder="5000" error={errors.amount?.message} />
      <Controller
        control={control}
        name="method"
        render={({ field: { onChange, value } }) => (
          <FormSelect label="Method" value={value} onChange={onChange} options={methodOptions} />
        )}
      />
      <Controller
        control={control}
        name="paymentDate"
        render={({ field: { onChange, value } }) => (
          <DatePickerField label="Payment Date" value={value} onChange={onChange} />
        )}
      />
      <FormInput control={control} name="note" label="Note" placeholder="Optional note" multiline />

      {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}
      <AppButton
        title={isEditing ? "Save Payment" : "Add Payment"}
        icon={Save}
        loading={mutation.isPending}
        onPress={handleSubmit((values) => mutation.mutate(values))}
      />
    </Screen>
  );
};
