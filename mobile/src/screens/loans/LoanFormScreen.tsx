import { zodResolver } from "@hookform/resolvers/zod";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Percent, Save } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Switch, Text, View } from "react-native";
import { z } from "zod";
import { api } from "../../api/client";
import { LoanType } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { DatePickerField } from "../../components/DatePickerField";
import { FormInput } from "../../components/FormInput";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { EmptyState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { toDateInput } from "../../utils/format";

const schema = z.object({
  contactId: z.string().min(1, "Contact required"),
  type: z.enum(["GIVEN", "TAKEN"]),
  amount: z.string().min(1, "Amount required").refine((value) => Number(value) > 0, "Amount must be greater than 0"),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  description: z.string().optional(),
  isInstallmentLoan: z.boolean(),
  installmentFrequency: z.enum(["MONTHLY", "WEEKLY", "CUSTOM"]).optional(),
  installmentAmount: z.string().optional(),
  totalInstallments: z.string().optional(),
  installmentStartDate: z.string().optional(),
  interestEnabled: z.boolean(),
  interestType: z.enum(["SIMPLE", "MONTHLY"]).optional(),
  interestRate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, "LoanForm">;

export const LoanFormScreen = ({ navigation, route }: Props) => {
  const loanId = route.params?.loanId;
  const initialContactId = route.params?.contactId;
  const isEditing = Boolean(loanId);
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();

  const contactsQuery = useQuery({
    queryKey: ["contacts", "loan-form"],
    queryFn: () => api.getContacts({ limit: 100 }),
  });
  const loanQuery = useQuery({
    queryKey: ["loan", loanId],
    queryFn: () => api.getLoan(loanId!),
    enabled: isEditing,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      contactId: initialContactId || "",
      type: "GIVEN",
      amount: "",
      issueDate: toDateInput(new Date()),
      dueDate: "",
      description: "",
      isInstallmentLoan: false,
      installmentFrequency: "MONTHLY",
      installmentAmount: "",
      totalInstallments: "",
      installmentStartDate: toDateInput(new Date()),
      interestEnabled: false,
      interestType: "SIMPLE",
      interestRate: "",
    },
  });

  useEffect(() => {
    if (loanQuery.data?.loan) {
      const loan = loanQuery.data.loan;
      reset({
        contactId: typeof loan.contactId === "string" ? loan.contactId : loan.contactId._id,
        type: loan.type,
        amount: String(loan.amount),
        issueDate: toDateInput(loan.issueDate),
        dueDate: toDateInput(loan.dueDate),
        description: loan.description || "",
        isInstallmentLoan: loan.isInstallmentLoan || false,
        installmentFrequency: loan.installmentFrequency || "MONTHLY",
        installmentAmount: loan.installmentAmount ? String(loan.installmentAmount) : "",
        totalInstallments: loan.totalInstallments ? String(loan.totalInstallments) : "",
        installmentStartDate: toDateInput(loan.installmentStartDate),
        interestEnabled: loan.interestEnabled || false,
        interestType: loan.interestType || "SIMPLE",
        interestRate: loan.interestRate ? String(loan.interestRate) : "",
      });
    }
  }, [loanQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        contactId: values.contactId,
        type: values.type as LoanType,
        amount: Number(values.amount),
        issueDate: values.issueDate || undefined,
        dueDate: values.dueDate || undefined,
        description: values.description || undefined,
        isInstallmentLoan: values.isInstallmentLoan,
        installmentFrequency: values.isInstallmentLoan ? values.installmentFrequency : undefined,
        installmentAmount: values.isInstallmentLoan && values.installmentAmount ? Number(values.installmentAmount) : undefined,
        totalInstallments: values.isInstallmentLoan && values.totalInstallments ? Number(values.totalInstallments) : undefined,
        installmentStartDate: values.isInstallmentLoan ? values.installmentStartDate : undefined,
        interestEnabled: values.interestEnabled,
        interestType: values.interestEnabled ? values.interestType : undefined,
        interestRate: values.interestEnabled && values.interestRate ? Number(values.interestRate) : undefined,
      };

      return isEditing ? api.updateLoan(loanId!, payload) : api.createLoan(payload);
    },
    onSuccess: async (loan) => {
      await queryClient.invalidateQueries({ queryKey: ["loans"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["contact"] });
      await queryClient.invalidateQueries({ queryKey: ["loan", loan._id] });
      navigation.goBack();
    },
  });

  if (contactsQuery.isLoading || loanQuery.isLoading) {
    return <Screen><LoadingState label="Preparing form..." /></Screen>;
  }

  const contacts = contactsQuery.data?.contacts || [];
  const isInstallmentLoan = watch("isInstallmentLoan");
  const interestEnabled = watch("interestEnabled");

  return (
    <Screen className="gap-4 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">{isEditing ? "Edit Loan" : "Naya Loan"}</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Amount aur due date clear rakhein.</Text>
      </View>

      {contacts.length ? (
        <Controller
          control={control}
          name="contactId"
          render={({ field: { onChange, value } }) => (
            <FormSelect
              label="Contact"
              value={value}
              onChange={onChange}
              error={errors.contactId?.message}
              options={contacts.map((contact) => ({ label: contact.name, value: contact._id }))}
            />
          )}
        />
      ) : (
        <EmptyState title="No contacts" subtitle="Loan banane se pehle contact add karein." />
      )}

      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value } }) => (
          <FormSelect
            label="Type"
            value={value}
            onChange={onChange}
            options={[
              { label: "Mujhe Lene Hain", value: "GIVEN" },
              { label: "Mujhe Dene Hain", value: "TAKEN" },
            ]}
          />
        )}
      />

      <FormInput control={control} name="amount" label="Amount" keyboardType="numeric" placeholder="10000" error={errors.amount?.message} />
      <Controller
        control={control}
        name="issueDate"
        render={({ field: { onChange, value } }) => (
          <DatePickerField label="Issue Date" value={value} onChange={onChange} />
        )}
      />
      <Controller
        control={control}
        name="dueDate"
        render={({ field: { onChange, value } }) => (
          <DatePickerField label="Due Date" value={value} onChange={onChange} />
        )}
      />
      <FormInput control={control} name="description" label="Description" placeholder="Optional details" multiline />

      <View className="gap-4 rounded-lg border border-border bg-card p-5">
        <View className="flex-row items-center gap-4">
          <View className="h-11 w-11 items-center justify-center rounded-lg bg-peach">
            <CalendarClock color={theme.primaryDark} size={21} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-dark">Installment Loan</Text>
            <Text className="mt-1 text-sm font-medium text-muted">Monthly ya weekly schedule auto-generate karein.</Text>
          </View>
          <Controller
            control={control}
            name="isInstallmentLoan"
            render={({ field: { value, onChange } }) => (
              <Switch value={value} onValueChange={onChange} />
            )}
          />
        </View>

        {isInstallmentLoan ? (
          <View className="gap-4">
            <Controller
              control={control}
              name="installmentFrequency"
              render={({ field: { onChange, value } }) => (
                <FormSelect
                  label="Frequency"
                  value={value}
                  onChange={onChange}
                  options={[
                    { label: "Monthly", value: "MONTHLY" },
                    { label: "Weekly", value: "WEEKLY" },
                    { label: "Custom", value: "CUSTOM" },
                  ]}
                />
              )}
            />
            <FormInput control={control} name="installmentAmount" label="Installment Amount" keyboardType="numeric" placeholder="5000" />
            <FormInput control={control} name="totalInstallments" label="Total Installments" keyboardType="number-pad" placeholder="4" />
            <Controller
              control={control}
              name="installmentStartDate"
              render={({ field: { onChange, value } }) => (
                <DatePickerField label="Installment Start Date" value={value} onChange={onChange} />
              )}
            />
          </View>
        ) : null}
      </View>

      <View className="gap-4 rounded-lg border border-border bg-card p-5">
        <View className="flex-row items-center gap-4">
          <View className="h-11 w-11 items-center justify-center rounded-lg bg-background-soft">
            <Percent color={theme.primary} size={21} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-dark">Interest</Text>
            <Text className="mt-1 text-sm font-medium text-muted">Default interest-free. Zarurat ho to enable karein.</Text>
          </View>
          <Controller
            control={control}
            name="interestEnabled"
            render={({ field: { value, onChange } }) => (
              <Switch value={value} onValueChange={onChange} />
            )}
          />
        </View>

        {interestEnabled ? (
          <View className="gap-4">
            <Controller
              control={control}
              name="interestType"
              render={({ field: { onChange, value } }) => (
                <FormSelect
                  label="Interest Type"
                  value={value}
                  onChange={onChange}
                  options={[
                    { label: "Simple", value: "SIMPLE" },
                    { label: "Monthly", value: "MONTHLY" },
                  ]}
                />
              )}
            />
            <FormInput control={control} name="interestRate" label="Interest Rate %" keyboardType="numeric" placeholder="5" />
          </View>
        ) : null}
      </View>

      {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}
      <AppButton
        title={isEditing ? "Save Changes" : "Create Loan"}
        icon={Save}
        disabled={!contacts.length}
        loading={mutation.isPending}
        onPress={handleSubmit((values) => mutation.mutate(values))}
      />
    </Screen>
  );
};
