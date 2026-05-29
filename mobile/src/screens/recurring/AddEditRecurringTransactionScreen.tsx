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
type Route = RouteProp<RootStackParamList, "AddEditRecurringTransaction">;
type FormValues = {
  title: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  categoryId: string;
  frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
  startDate: string;
  endDate?: string;
  paymentMethod: "CASH" | "BANK" | "JAZZCASH" | "EASYPAISA" | "OTHER";
  autoCreateTransaction: "true" | "false";
  reminderEnabled: "true" | "false";
  note?: string;
};

export const AddEditRecurringTransactionScreen = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const queryClient = useQueryClient();
  const id = route.params?.recurringTransactionId;
  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: { title: "", type: "EXPENSE", amount: "", categoryId: "", frequency: "MONTHLY", startDate: new Date().toISOString(), endDate: undefined, paymentMethod: "CASH", autoCreateTransaction: "false", reminderEnabled: "true", note: "" },
  });
  const categories = useQuery({ queryKey: ["categories", watch("type")], queryFn: () => api.getCategories({ type: watch("type") }) });
  const detail = useQuery({ queryKey: ["recurring-transaction", id], queryFn: () => api.getRecurringTransaction(id!), enabled: Boolean(id) });

  useEffect(() => {
    const item = detail.data?.recurringTransaction;
    if (!item) return;
    setValue("title", item.title);
    setValue("type", item.type);
    setValue("amount", String(item.amount));
    setValue("categoryId", typeof item.categoryId === "string" ? item.categoryId : item.categoryId._id);
    setValue("frequency", item.frequency);
    setValue("startDate", item.startDate);
    setValue("endDate", item.endDate);
    setValue("paymentMethod", item.paymentMethod);
    setValue("autoCreateTransaction", item.autoCreateTransaction ? "true" : "false");
    setValue("reminderEnabled", item.reminderEnabled ? "true" : "false");
    setValue("note", item.note || "");
  }, [detail.data, setValue]);

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => id ? api.updateRecurringTransaction(id, payload) : api.createRecurringTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
      navigation.goBack();
    },
  });
  const submit = handleSubmit((values) => mutation.mutate({
    ...values,
    amount: Number(values.amount),
    autoCreateTransaction: values.autoCreateTransaction === "true",
    reminderEnabled: values.reminderEnabled === "true",
    reminderDaysBefore: 2,
  }));

  return (
    <Screen className="gap-4 pt-5">
      <FormSelect label="Type" value={watch("type")} onChange={(value) => setValue("type", value)} options={[{ label: "Expense", value: "EXPENSE" }, { label: "Income", value: "INCOME" }]} />
      <FormInput control={control} name="title" label="Title" placeholder="Monthly groceries" />
      <FormInput control={control} name="amount" label="Amount" placeholder="5000" keyboardType="numeric" />
      <FormSelect label="Category" value={watch("categoryId")} onChange={(value) => setValue("categoryId", value)} options={(categories.data || []).map((category) => ({ label: category.name, value: category._id }))} />
      <FormSelect label="Frequency" value={watch("frequency")} onChange={(value) => setValue("frequency", value)} options={[
        { label: "Weekly", value: "WEEKLY" },
        { label: "Monthly", value: "MONTHLY" },
        { label: "Quarterly", value: "QUARTERLY" },
        { label: "Yearly", value: "YEARLY" },
        { label: "Custom", value: "CUSTOM" },
      ]} />
      <DatePickerField label="Start date" value={watch("startDate")} onChange={(value) => setValue("startDate", value)} />
      <DatePickerField label="End date optional" value={watch("endDate") || watch("startDate")} onChange={(value) => setValue("endDate", value)} />
      <FormSelect label="Payment method" value={watch("paymentMethod")} onChange={(value) => setValue("paymentMethod", value)} options={[
        { label: "Cash", value: "CASH" },
        { label: "Bank", value: "BANK" },
        { label: "JazzCash", value: "JAZZCASH" },
        { label: "EasyPaisa", value: "EASYPAISA" },
        { label: "Other", value: "OTHER" },
      ]} />
      <FormSelect label="Auto-create transaction on due date" value={watch("autoCreateTransaction")} onChange={(value) => setValue("autoCreateTransaction", value)} options={[{ label: "No", value: "false" }, { label: "Yes", value: "true" }]} />
      <FormSelect label="Reminder" value={watch("reminderEnabled")} onChange={(value) => setValue("reminderEnabled", value)} options={[{ label: "On", value: "true" }, { label: "Off", value: "false" }]} />
      <FormInput control={control} name="note" label="Note" placeholder="Optional" multiline />
      <AppButton title={id ? "Save Recurring" : "Create Recurring"} icon={Save} loading={mutation.isPending} onPress={submit} />
    </Screen>
  );
};
