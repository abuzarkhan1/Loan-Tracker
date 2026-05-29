import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, HandCoins, Plus, XCircle } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { Contact, Loan, PromiseToPay } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { StatusBadge } from "../../components/StatusBadge";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency, formatDate } from "../../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "Promises">;
type PromiseStatus = PromiseToPay["status"] | "ALL";

const statusOptions: { label: string; value: PromiseStatus }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Kept", value: "KEPT" },
  { label: "Broken", value: "BROKEN" },
  { label: "Cancelled", value: "CANCELLED" },
];

const getContactName = (value: string | Contact | undefined) => (typeof value === "object" ? value.name : "Contact");
const getLoanId = (value: string | Loan) => (typeof value === "object" ? value._id : value);

export const PromisesScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const params = route.params || {};
  const [status, setStatus] = useState<PromiseStatus>((params.status as PromiseStatus) || "ALL");
  const promisesQuery = useQuery({
    queryKey: ["promises", params.contactId, params.loanId, status],
    queryFn: () =>
      api.getPromises({
        contactId: params.contactId,
        loanId: params.loanId,
        status: status === "ALL" ? undefined : status,
        limit: 50,
      }),
  });

  const markMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "kept" | "broken" }) =>
      action === "kept" ? api.markPromiseKept(id) : api.markPromiseBroken(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["promises"] });
      await queryClient.invalidateQueries({ queryKey: ["recovery"] });
    },
  });

  if (promisesQuery.isLoading) return <Screen><LoadingState label="Loading promises..." /></Screen>;
  if (promisesQuery.isError) return <Screen><ErrorState message="Promises load nahi ho sake." onRetry={promisesQuery.refetch} /></Screen>;

  const promises = promisesQuery.data?.promises || [];

  return (
    <Screen className="pt-5">
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <Text className="text-2xl font-black text-dark">Promise to Pay</Text>
          <Text className="mt-1 text-sm font-medium text-muted">Future payment commitments aur status track karein.</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("AddPromise", { contactId: params.contactId, loanId: params.loanId })}
          className="h-11 w-11 items-center justify-center rounded-lg bg-primary"
        >
          <Plus color={theme.white} size={21} />
        </TouchableOpacity>
      </View>

      <View className="mt-5">
        <FormSelect label="Status" value={status} options={statusOptions} onChange={setStatus} />
      </View>

      <View className="mt-5 gap-3">
        {promises.length ? (
          promises.map((promise) => (
            <View key={promise._id} className="rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
              <View className="flex-row items-start gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-lg bg-peach">
                  <HandCoins color={theme.primaryDark} size={20} />
                </View>
                <View className="flex-1">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text className="text-base font-black text-dark">{getContactName(promise.contactId)}</Text>
                    <StatusBadge value={promise.status} />
                  </View>
                  <Text className="mt-2 text-2xl font-black text-primary">{formatCurrency(promise.promisedAmount)}</Text>
                  <Text className="mt-1 text-sm font-semibold text-muted">Promise date: {formatDate(promise.promiseDate)}</Text>
                  {promise.note ? <Text className="mt-2 text-sm font-medium text-muted">{promise.note}</Text> : null}

                  {promise.status === "PENDING" ? (
                    <View className="mt-4 flex-row gap-3">
                      <View className="flex-1">
                        <AppButton
                          title="Kept"
                          icon={CheckCircle2}
                          variant="secondary"
                          loading={markMutation.isPending}
                          onPress={() => markMutation.mutate({ id: promise._id, action: "kept" })}
                        />
                      </View>
                      <View className="flex-1">
                        <AppButton
                          title="Broken"
                          icon={XCircle}
                          variant="secondary"
                          loading={markMutation.isPending}
                          onPress={() => markMutation.mutate({ id: promise._id, action: "broken" })}
                        />
                      </View>
                    </View>
                  ) : null}

                  <View className="mt-3">
                    <AppButton
                      title="Open Loan"
                      variant="secondary"
                      onPress={() => navigation.navigate("LoanDetail", { loanId: getLoanId(promise.loanId) })}
                    />
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <EmptyState title="No promises found" subtitle="Add Promise se future payment date record karein." />
        )}
      </View>
    </Screen>
  );
};
