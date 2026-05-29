import { zodResolver } from "@hookform/resolvers/zod";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, TouchableOpacity, View } from "react-native";
import { z } from "zod";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { FormInput } from "../../components/FormInput";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { fontFamily } from "../../utils/theme";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  type: z.enum(["EXPENSE", "LOAN_REPAYMENT", "SAVINGS", "OTHER"]),
  categoryId: z.string().optional(),
  allocatedAmount: z.string().min(1, "Amount required").refine((value) => Number(value) >= 0, "Invalid amount"),
});

type FormValues = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, "AddEditAllocation">;

export const AddEditAllocationScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const allocationId = route.params?.allocationId;
  const summaryQuery = useQuery({ queryKey: ["salary", "allocation-summary", "edit"], queryFn: () => api.getSalaryAllocationSummary() });
  const categoriesQuery = useQuery({ queryKey: ["categories", "allocation", "expense"], queryFn: () => api.getCategories({ type: "EXPENSE" }) });
  const allocation = summaryQuery.data?.allocations.find((item) => item._id === allocationId);
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", type: "EXPENSE", categoryId: "", allocatedAmount: "" },
  });

  useEffect(() => {
    if (allocation) {
      reset({
        name: allocation.name,
        type: allocation.type,
        categoryId: typeof allocation.categoryId === "string" ? allocation.categoryId : allocation.categoryId?._id || "",
        allocatedAmount: String(allocation.allocatedAmount),
      });
    }
  }, [allocation, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        name: values.name,
        type: values.type,
        categoryId: values.type === "EXPENSE" && values.categoryId ? values.categoryId : undefined,
        allocatedAmount: Number(values.allocatedAmount),
      };
      return allocationId ? api.updateSalaryAllocation(allocationId, payload) : api.createSalaryAllocation(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["salary", "allocation"] });
      await queryClient.invalidateQueries({ queryKey: ["finance"] });
      navigation.goBack();
    },
  });

  return (
    <Screen className="gap-4 pt-5">
      <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>
        {allocationId ? "Edit Allocation" : "Add Allocation"}
      </Text>
      <FormInput control={control} name="name" label="Name" placeholder="Food budget" error={errors.name?.message} />
      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value } }) => (
          <FormSelect
            label="Type"
            value={value}
            onChange={onChange}
            options={[
              { label: "Expense", value: "EXPENSE" },
              { label: "Loan Repayment", value: "LOAN_REPAYMENT" },
              { label: "Savings", value: "SAVINGS" },
              { label: "Other", value: "OTHER" },
            ]}
          />
        )}
      />
      <Controller
        control={control}
        name="categoryId"
        render={({ field: { onChange, value } }) => (
          <View style={{ gap: 8 }}>
            <Text className="text-sm font-bold text-muted">Expense Category Optional</Text>
            <View className="flex-row flex-wrap gap-2">
              <TouchableOpacity
                activeOpacity={0.86}
                onPress={() => onChange("")}
                className="rounded-full border px-4 py-2"
                style={{ borderColor: !value ? theme.primary : theme.border, backgroundColor: !value ? theme.primary : theme.pill }}
              >
                <Text className={value ? "text-muted" : "text-white"} style={{ fontFamily: fontFamily.bold, fontSize: 12 }}>All Expenses</Text>
              </TouchableOpacity>
              {categoriesQuery.data?.map((category) => {
                const active = value === category._id;
                return (
                  <TouchableOpacity
                    key={category._id}
                    activeOpacity={0.86}
                    onPress={() => onChange(category._id)}
                    className="rounded-full border px-4 py-2"
                    style={{ borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : theme.pill }}
                  >
                    <Text className={active ? "text-white" : "text-muted"} style={{ fontFamily: fontFamily.bold, fontSize: 12 }}>{category.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      />
      <FormInput control={control} name="allocatedAmount" label="Allocated Amount" keyboardType="numeric" placeholder="25000" error={errors.allocatedAmount?.message} />
      {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}
      <AppButton title="Save Allocation" icon={Save} loading={mutation.isPending} onPress={handleSubmit((values) => mutation.mutate(values))} />
    </Screen>
  );
};
