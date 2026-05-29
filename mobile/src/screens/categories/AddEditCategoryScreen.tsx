import { zodResolver } from "@hookform/resolvers/zod";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text } from "react-native";
import { z } from "zod";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { FormInput } from "../../components/FormInput";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";
import { getErrorMessage } from "../../utils/errors";
import { fontFamily } from "../../utils/theme";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().optional(),
  monthlyBudget: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, "AddEditCategory">;

export const AddEditCategoryScreen = ({ navigation, route }: Props) => {
  const queryClient = useQueryClient();
  const categoryId = route.params?.categoryId;
  const categoriesQuery = useQuery({
    queryKey: ["categories", "edit", route.params?.type],
    queryFn: () => api.getCategories({ type: route.params?.type, includeInactive: true }),
  });
  const category = categoriesQuery.data?.find((item) => item._id === categoryId);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", type: route.params?.type || "EXPENSE", icon: "", monthlyBudget: "" },
  });

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        type: category.type,
        icon: category.icon || "",
        monthlyBudget: category.monthlyBudget ? String(category.monthlyBudget) : "",
      });
    }
  }, [category, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        name: values.name,
        type: values.type,
        icon: values.icon || undefined,
        monthlyBudget: values.monthlyBudget ? Number(values.monthlyBudget) : undefined,
      };
      return categoryId ? api.updateCategory(categoryId, payload) : api.createCategory(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      navigation.goBack();
    },
  });

  return (
    <Screen className="gap-4 pt-5">
      <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>
        {categoryId ? "Edit Category" : "Add Category"}
      </Text>
      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value } }) => (
          <FormSelect label="Type" value={value} onChange={onChange} options={[{ label: "Expense", value: "EXPENSE" }, { label: "Income", value: "INCOME" }]} />
        )}
      />
      <FormInput control={control} name="name" label="Name" placeholder="Food" error={errors.name?.message} />
      <FormInput control={control} name="icon" label="Icon / Initial" placeholder="F or FOOD" />
      <FormInput control={control} name="monthlyBudget" label="Monthly Budget" keyboardType="numeric" placeholder="Optional" />
      {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}
      <AppButton title="Save Category" icon={Save} loading={mutation.isPending} onPress={handleSubmit((values) => mutation.mutate(values))} />
    </Screen>
  );
};
