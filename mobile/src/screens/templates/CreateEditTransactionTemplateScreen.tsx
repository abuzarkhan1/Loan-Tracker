import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react-native";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { FormInput } from "../../components/FormInput";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "CreateEditTransactionTemplate">;
type FormValues = { title: string; type: "INCOME" | "EXPENSE"; amount: string; categoryId: string; paymentMethod: "CASH" | "BANK" | "JAZZCASH" | "EASYPAISA" | "OTHER"; isFavorite: "true" | "false"; note?: string };

export const CreateEditTransactionTemplateScreen = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const queryClient = useQueryClient();
  const id = route.params?.templateId;
  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({ defaultValues: { title: "", type: "EXPENSE", amount: "", categoryId: "", paymentMethod: "CASH", isFavorite: "false", note: "" } });
  const categories = useQuery({ queryKey: ["categories", watch("type")], queryFn: () => api.getCategories({ type: watch("type") }) });
  const list = useQuery({ queryKey: ["transaction-templates"], queryFn: () => api.getTransactionTemplates({ limit: 100 }), enabled: Boolean(id) });
  useEffect(() => {
    const template = list.data?.templates.find((item) => item._id === id);
    if (!template) return;
    setValue("title", template.title);
    setValue("type", template.type);
    setValue("amount", String(template.amount));
    setValue("categoryId", typeof template.categoryId === "string" ? template.categoryId : template.categoryId._id);
    setValue("paymentMethod", template.paymentMethod);
    setValue("isFavorite", template.isFavorite ? "true" : "false");
    setValue("note", template.note || "");
  }, [id, list.data, setValue]);
  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => id ? api.updateTransactionTemplate(id, payload) : api.createTransactionTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction-templates"] });
      navigation.goBack();
    },
  });
  const submit = handleSubmit((values) => mutation.mutate({ ...values, amount: Number(values.amount), isFavorite: values.isFavorite === "true" }));
  return (
    <Screen className="gap-4 pt-5">
      <FormSelect label="Type" value={watch("type")} onChange={(value) => setValue("type", value)} options={[{ label: "Expense", value: "EXPENSE" }, { label: "Income", value: "INCOME" }]} />
      <FormInput control={control} name="title" label="Title" placeholder="Fuel" />
      <FormInput control={control} name="amount" label="Amount" placeholder="1000" keyboardType="numeric" />
      <FormSelect label="Category" value={watch("categoryId")} onChange={(value) => setValue("categoryId", value)} options={(categories.data || []).map((category) => ({ label: category.name, value: category._id }))} />
      <FormSelect label="Method" value={watch("paymentMethod")} onChange={(value) => setValue("paymentMethod", value)} options={[
        { label: "Cash", value: "CASH" },
        { label: "Bank", value: "BANK" },
        { label: "JazzCash", value: "JAZZCASH" },
        { label: "EasyPaisa", value: "EASYPAISA" },
        { label: "Other", value: "OTHER" },
      ]} />
      <FormSelect label="Favorite" value={watch("isFavorite")} onChange={(value) => setValue("isFavorite", value)} options={[{ label: "No", value: "false" }, { label: "Yes", value: "true" }]} />
      <FormInput control={control} name="note" label="Note" placeholder="Optional" />
      <AppButton title="Save Template" icon={Save} loading={mutation.isPending} onPress={submit} />
    </Screen>
  );
};
