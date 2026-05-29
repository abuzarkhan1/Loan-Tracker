import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calculator } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { DatePickerField } from "../../components/DatePickerField";
import { FormInput } from "../../components/FormInput";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type FormValues = { amount: string; categoryId?: string; plannedDate: string; note?: string };

export const AffordabilityCalculatorScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: { amount: "", plannedDate: new Date().toISOString(), note: "" },
  });
  const categories = useQuery({ queryKey: ["categories", "EXPENSE"], queryFn: () => api.getCategories({ type: "EXPENSE" }) });
  const check = useMutation({
    mutationFn: (payload: { amount: number; categoryId?: string; plannedDate: string; note?: string }) => api.checkAffordability(payload),
    onSuccess: (result) => navigation.navigate("AffordabilityResult", { result }),
  });
  const submit = handleSubmit((values) => check.mutate({ ...values, amount: Number(values.amount) }));
  return (
    <Screen className="gap-4 pt-5">
      <FormInput control={control} name="amount" label="Planned amount" placeholder="25000" keyboardType="numeric" />
      <FormSelect label="Category" value={watch("categoryId")} onChange={(value) => setValue("categoryId", value)} options={(categories.data || []).map((category) => ({ label: category.name, value: category._id }))} />
      <DatePickerField label="Planned date" value={watch("plannedDate")} onChange={(value) => setValue("plannedDate", value)} />
      <FormInput control={control} name="note" label="Note" placeholder="Phone purchase" />
      <AppButton title="Check Affordability" icon={Calculator} loading={check.isPending} onPress={submit} />
    </Screen>
  );
};
