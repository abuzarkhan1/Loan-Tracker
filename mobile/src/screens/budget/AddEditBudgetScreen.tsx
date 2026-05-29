import { zodResolver } from "@hookform/resolvers/zod";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Text, TextInput, View } from "react-native";
import { z } from "zod";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { FormInput } from "../../components/FormInput";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { fontFamily } from "../../utils/theme";

const schema = z.object({
  totalBudget: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, "AddEditBudget">;

export const AddEditBudgetScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const budgetQuery = useQuery({ queryKey: ["budgets", "current", "edit"], queryFn: () => api.getCurrentBudget() });
  const categoriesQuery = useQuery({ queryKey: ["categories", "expense", "budget"], queryFn: () => api.getCategories({ type: "EXPENSE" }) });
  const [categoryAmounts, setCategoryAmounts] = useState<Record<string, string>>({});
  const budget = useMemo(() => budgetQuery.data?._id === route.params?.budgetId ? budgetQuery.data : budgetQuery.data, [budgetQuery.data, route.params?.budgetId]);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { totalBudget: "" },
  });

  useEffect(() => {
    if (budget) {
      reset({ totalBudget: budget.totalBudget ? String(budget.totalBudget) : "" });
      const nextAmounts: Record<string, string> = {};
      budget.categoryBudgets.forEach((item) => {
        const id = typeof item.categoryId === "string" ? item.categoryId : item.categoryId._id;
        nextAmounts[id] = String(item.amount);
      });
      setCategoryAmounts(nextAmounts);
    }
  }, [budget, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const categoryBudgets = Object.entries(categoryAmounts)
        .filter(([, amount]) => Number(amount) > 0)
        .map(([categoryId, amount]) => ({ categoryId, amount: Number(amount) }));
      const payload = {
        totalBudget: values.totalBudget ? Number(values.totalBudget) : undefined,
        categoryBudgets,
      };
      return budget?._id ? api.updateBudget(budget._id, payload) : api.createBudget(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets"] });
      await queryClient.invalidateQueries({ queryKey: ["finance"] });
      navigation.goBack();
    },
  });

  return (
    <Screen className="gap-4 pt-5">
      <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Budget Setup</Text>
      <FormInput control={control} name="totalBudget" label="Total Budget" keyboardType="numeric" placeholder="80000" />
      <View className="gap-3">
        <Text className="text-sm font-black text-muted">Category Budgets</Text>
        {categoriesQuery.data?.map((category) => (
          <View key={category._id} className="rounded-2xl border border-border bg-card p-4" style={theme.shadowSoft}>
            <Text className="mb-2 text-sm font-black text-dark">{category.name}</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="Amount"
              placeholderTextColor={theme.placeholder}
              value={categoryAmounts[category._id] || ""}
              onChangeText={(value) => setCategoryAmounts((current) => ({ ...current, [category._id]: value }))}
              style={{
                minHeight: 46,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.input,
                color: theme.text,
                paddingHorizontal: 16,
                fontFamily: fontFamily.semiBold,
              }}
            />
          </View>
        ))}
      </View>
      {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}
      <AppButton title="Save Budget" icon={Save} loading={mutation.isPending} onPress={handleSubmit((values) => mutation.mutate(values))} />
    </Screen>
  );
};
