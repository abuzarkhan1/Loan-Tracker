import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react-native";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { DatePickerField } from "../../components/DatePickerField";
import { FormInput } from "../../components/FormInput";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "AddEditBill">;
type FormValues = {
  title: string;
  amount: string;
  frequency: "ONCE" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  dueDate: string;
  paymentMethod: "CASH" | "BANK" | "JAZZCASH" | "EASYPAISA" | "OTHER";
  categoryId?: string;
  reminderEnabled: "true" | "false";
  autoCreateExpense: "true" | "false";
  note?: string;
};

export const AddEditBillScreen = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const queryClient = useQueryClient();
  const billId = route.params?.billId;
  const detail = useQuery({ queryKey: ["bill", billId], queryFn: () => api.getBill(billId!), enabled: Boolean(billId) });
  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: { title: "", amount: "", frequency: "MONTHLY", dueDate: new Date().toISOString(), paymentMethod: "CASH", categoryId: undefined, reminderEnabled: "true", autoCreateExpense: "true", note: "" },
  });
  const categories = useQuery({ queryKey: ["categories", "EXPENSE"], queryFn: () => api.getCategories({ type: "EXPENSE" }) });

  useEffect(() => {
    const bill = detail.data?.bill;
    if (!bill) return;
    setValue("title", bill.title);
    setValue("amount", String(bill.amount));
    setValue("frequency", bill.frequency as FormValues["frequency"]);
    setValue("dueDate", bill.dueDate);
    setValue("paymentMethod", bill.paymentMethod);
    setValue("categoryId", typeof bill.categoryId === "string" ? bill.categoryId : bill.categoryId?._id);
    setValue("reminderEnabled", bill.reminderEnabled ? "true" : "false");
    setValue("autoCreateExpense", bill.autoCreateExpense ? "true" : "false");
    setValue("note", bill.note || "");
  }, [detail.data, setValue]);

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => billId ? api.updateBill(billId, payload) : api.createBill(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      navigation.goBack();
    },
  });

  const submit = handleSubmit((values) => mutation.mutate({
    ...values,
    amount: Number(values.amount),
    dueDate: values.dueDate,
    autoCreateExpense: values.autoCreateExpense === "true",
    reminderEnabled: values.reminderEnabled === "true",
    reminderDaysBefore: 2,
  }));

  return (
    <Screen className="gap-4 pt-5">
      <FormInput control={control} name="title" label="Bill title" placeholder="Internet bill" />
      <FormInput control={control} name="amount" label="Amount" placeholder="5000" keyboardType="numeric" />
      <FormSelect label="Category" value={watch("categoryId")} onChange={(value) => setValue("categoryId", value)} options={(categories.data || []).map((category) => ({ label: category.name, value: category._id }))} />
      <FormSelect label="Frequency" value={watch("frequency")} onChange={(value) => setValue("frequency", value)} options={[
        { label: "Once", value: "ONCE" },
        { label: "Weekly", value: "WEEKLY" },
        { label: "Monthly", value: "MONTHLY" },
        { label: "Quarterly", value: "QUARTERLY" },
        { label: "Yearly", value: "YEARLY" },
      ]} />
      <DatePickerField label="Due date" value={watch("dueDate")} onChange={(value) => setValue("dueDate", value)} />
      <FormSelect label="Payment method" value={watch("paymentMethod")} onChange={(value) => setValue("paymentMethod", value)} options={[
        { label: "Cash", value: "CASH" },
        { label: "Bank", value: "BANK" },
        { label: "JazzCash", value: "JAZZCASH" },
        { label: "EasyPaisa", value: "EASYPAISA" },
        { label: "Other", value: "OTHER" },
      ]} />
      <FormSelect label="Reminder" value={watch("reminderEnabled")} onChange={(value) => setValue("reminderEnabled", value)} options={[{ label: "On", value: "true" }, { label: "Off", value: "false" }]} />
      <FormSelect label="Create expense when paid" value={watch("autoCreateExpense")} onChange={(value) => setValue("autoCreateExpense", value)} options={[{ label: "Yes", value: "true" }, { label: "No", value: "false" }]} />
      <FormInput control={control} name="note" label="Note" placeholder="Optional" multiline />
      <View className="pt-2">
        <AppButton title={billId ? "Save Bill" : "Create Bill"} icon={Save} loading={mutation.isPending} onPress={submit} />
      </View>
    </Screen>
  );
};
