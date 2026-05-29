import { zodResolver } from "@hookform/resolvers/zod";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, TouchableOpacity, View } from "react-native";
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
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { paymentMethodOptions } from "../../utils/finance";
import { toDateInput } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

const schema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.string().min(1, "Amount required").refine((value) => Number(value) > 0, "Amount must be greater than 0"),
  categoryId: z.string().optional(),
  source: z.string().optional(),
  date: z.string().min(1, "Date required"),
  paymentMethod: z.enum(["CASH", "BANK", "JAZZCASH", "EASYPAISA", "OTHER"]),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  route: { name: string; params?: { transactionId?: string; defaultType?: "INCOME" | "EXPENSE" } };
};

const TransactionForm = ({ navigation, route, forcedType }: Props & { forcedType?: "INCOME" | "EXPENSE" }) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const transactionId = route.params?.transactionId;
  const defaultType = forcedType || route.params?.defaultType || "EXPENSE";
  const isEditing = Boolean(transactionId);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: defaultType,
      amount: "",
      categoryId: "",
      source: "",
      date: toDateInput(new Date()),
      paymentMethod: "CASH",
      note: "",
    },
  });

  const type = watch("type");
  const categoriesQuery = useQuery({
    queryKey: ["categories", type],
    queryFn: () => api.getCategories({ type }),
  });
  const transactionQuery = useQuery({
    queryKey: ["transaction", transactionId],
    queryFn: () => api.getTransaction(transactionId!),
    enabled: Boolean(transactionId),
  });

  useEffect(() => {
    if (transactionQuery.data) {
      const transaction = transactionQuery.data;
      reset({
        type: transaction.type === "INCOME" ? "INCOME" : "EXPENSE",
        amount: String(transaction.amount),
        categoryId: typeof transaction.categoryId === "string" ? transaction.categoryId : transaction.categoryId?._id || "",
        source: transaction.source || "",
        date: toDateInput(transaction.date),
        paymentMethod: transaction.paymentMethod,
        note: transaction.note || "",
      });
    }
  }, [reset, transactionQuery.data]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        type: values.type,
        amount: Number(values.amount),
        categoryId: values.categoryId || undefined,
        source: values.source || undefined,
        date: values.date,
        paymentMethod: values.paymentMethod as PaymentMethod,
        note: values.note || undefined,
      };
      return isEditing ? api.updateTransaction(transactionId!, payload) : api.createTransaction(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["finance"] });
      await queryClient.invalidateQueries({ queryKey: ["salary"] });
      navigation.goBack();
    },
  });

  if (transactionQuery.isLoading) return <Screen><LoadingState label="Loading transaction..." /></Screen>;

  return (
    <Screen className="gap-4 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>
          {isEditing ? "Edit Transaction" : forcedType === "INCOME" ? "Add Income" : forcedType === "EXPENSE" ? "Add Expense" : "Add Transaction"}
        </Text>
        <Text className="mt-1 text-sm font-medium text-muted">Simple cash flow record.</Text>
      </View>

      {!forcedType ? (
        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => (
            <FormSelect
              label="Type"
              value={value}
              onChange={(nextValue) => {
                onChange(nextValue);
                setValue("categoryId", "");
              }}
              options={[
                { label: "Expense", value: "EXPENSE" },
                { label: "Income", value: "INCOME" },
              ]}
            />
          )}
        />
      ) : null}

      <FormInput control={control} name="amount" label="Amount" keyboardType="numeric" placeholder="5000" error={errors.amount?.message} />

      <Controller
        control={control}
        name="categoryId"
        render={({ field: { onChange, value } }) => (
          <View style={{ gap: 8 }}>
            <View className="flex-row items-center justify-between">
              <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>Category</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Categories")}>
                <Text className="text-xs font-black text-primary">Manage</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {categoriesQuery.data?.filter((category) => category.isActive).map((category) => {
                const selected = value === category._id;
                return (
                  <TouchableOpacity
                    key={category._id}
                    activeOpacity={0.86}
                    onPress={() => onChange(category._id)}
                    className="rounded-full border px-4 py-2"
                    style={{ borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : theme.pill }}
                  >
                    <Text style={{ color: selected ? theme.white : theme.muted, fontFamily: fontFamily.bold, fontSize: 12 }}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      />

      <FormInput control={control} name="source" label={type === "INCOME" ? "Source" : "Merchant / Source"} placeholder={type === "INCOME" ? "Freelance, business..." : "Optional"} />
      <Controller control={control} name="date" render={({ field: { onChange, value } }) => <DatePickerField label="Date" value={value} onChange={onChange} error={errors.date?.message} />} />
      <Controller control={control} name="paymentMethod" render={({ field: { onChange, value } }) => <FormSelect label="Payment Method" value={value} onChange={onChange} options={paymentMethodOptions} />} />
      <FormInput control={control} name="note" label="Note" placeholder="Optional note" multiline />

      {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}
      <AppButton title={isEditing ? "Save Transaction" : "Add Transaction"} icon={Save} loading={mutation.isPending} onPress={handleSubmit((values) => mutation.mutate(values))} />
    </Screen>
  );
};

export const AddTransactionScreen = (props: Props) => <TransactionForm {...props} />;
export const AddExpenseScreen = (props: Props) => <TransactionForm {...props} forcedType="EXPENSE" />;
export const AddIncomeScreen = (props: Props) => <TransactionForm {...props} forcedType="INCOME" />;
