import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { DatePickerField } from "../../components/DatePickerField";
import { FormInput } from "../../components/FormInput";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "MarkBillPaid">;
type FormValues = {
  amount: string;
  paidDate: string;
  paymentMethod: "CASH" | "BANK" | "JAZZCASH" | "EASYPAISA" | "OTHER";
  note?: string;
};

export const MarkBillPaidScreen = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const queryClient = useQueryClient();
  const { occurrenceId, billId, defaultAmount } = route.params;
  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: { amount: defaultAmount ? String(defaultAmount) : "", paidDate: new Date().toISOString(), paymentMethod: "CASH", note: "" },
  });
  const mutation = useMutation({
    mutationFn: (payload: { amount: number; paidDate: string; paymentMethod: FormValues["paymentMethod"]; note?: string }) => api.markBillPaid(occurrenceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      if (billId) queryClient.invalidateQueries({ queryKey: ["bill", billId] });
      navigation.goBack();
    },
  });
  const submit = handleSubmit((values) => mutation.mutate({ ...values, amount: Number(values.amount || defaultAmount || 0) }));
  return (
    <Screen className="gap-4 pt-5">
      <FormInput control={control} name="amount" label="Paid amount" placeholder="5000" keyboardType="numeric" />
      <DatePickerField label="Paid date" value={watch("paidDate")} onChange={(value) => setValue("paidDate", value)} />
      <FormSelect label="Payment method" value={watch("paymentMethod")} onChange={(value) => setValue("paymentMethod", value)} options={[
        { label: "Cash", value: "CASH" },
        { label: "Bank", value: "BANK" },
        { label: "JazzCash", value: "JAZZCASH" },
        { label: "EasyPaisa", value: "EASYPAISA" },
        { label: "Other", value: "OTHER" },
      ]} />
      <FormInput control={control} name="note" label="Note" placeholder="Optional" multiline />
      <AppButton title="Confirm Paid" icon={CheckCircle2} loading={mutation.isPending} onPress={submit} />
    </Screen>
  );
};
