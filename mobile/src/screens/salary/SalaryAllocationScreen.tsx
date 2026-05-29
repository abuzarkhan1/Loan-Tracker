import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, WalletCards } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { SalaryAllocation } from "../../api/types";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { showAlert } from "../../providers/AlertProvider";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const AllocationCard = ({ allocation, onEdit, onDelete }: { allocation: SalaryAllocation; onEdit: () => void; onDelete: () => void }) => {
  const { theme } = useAppTheme();
  const progress = allocation.allocatedAmount > 0 ? Math.min(100, Math.round((allocation.usedAmount / allocation.allocatedAmount) * 100)) : 0;
  return (
    <View className="rounded-3xl border border-border bg-card p-4" style={theme.shadowSoft}>
      <View className="flex-row items-start gap-4">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-background-soft">
          <WalletCards color={theme.primary} size={22} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-black text-dark">{allocation.name}</Text>
          <Text className="mt-1 text-xs font-semibold text-muted">{allocation.type} · {formatCurrency(allocation.usedAmount)} used</Text>
        </View>
        <TouchableOpacity onPress={onEdit} className="h-9 w-9 items-center justify-center rounded-full bg-background-soft">
          <Pencil color={theme.primary} size={16} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} className="h-9 w-9 items-center justify-center rounded-full bg-background-soft">
          <Trash2 color={theme.danger} size={16} />
        </TouchableOpacity>
      </View>
      <View className="mt-4">
        <ProgressBar progress={progress} />
        <View className="mt-2 flex-row justify-between">
          <Text className="text-xs font-bold text-muted">{formatCurrency(allocation.allocatedAmount)} allocated</Text>
          <Text className="text-xs font-bold text-muted">{formatCurrency(allocation.remainingAmount)} left</Text>
        </View>
      </View>
    </View>
  );
};

export const SalaryAllocationScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const summaryQuery = useQuery({ queryKey: ["salary", "allocation-summary"], queryFn: () => api.getSalaryAllocationSummary() });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSalaryAllocation(id),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["salary", "allocation"] }),
  });

  const confirmDelete = (id: string) => {
    showAlert({
      title: "Delete allocation?",
      message: "Salary allocation remove ho jayegi.",
      buttons: [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(id) }],
    });
  };

  if (summaryQuery.isLoading) return <Screen><LoadingState label="Loading allocations..." /></Screen>;
  if (summaryQuery.isError) return <Screen><ErrorState message="Salary allocations load nahi ho sake." onRetry={summaryQuery.refetch} /></Screen>;
  const summary = summaryQuery.data;

  return (
    <Screen className="gap-5 pt-5">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Salary Allocation</Text>
          <Text className="mt-1 text-sm font-medium text-muted">Plan where salary should go.</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.86}
          onPress={() => navigation.navigate("AddEditAllocation")}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-primary"
          style={theme.shadowSoft}
        >
          <Plus color={theme.white} size={22} />
        </TouchableOpacity>
      </View>
      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <Text className="text-xs font-black uppercase text-muted">Allocation Summary</Text>
        <Text className="mt-2 text-2xl font-black text-dark">{formatCurrency(summary?.allocatedAmount || 0)}</Text>
        <Text className="mt-1 text-sm font-semibold text-muted">Unallocated: {formatCurrency(summary?.unallocatedAmount || 0)}</Text>
      </View>
      <View className="gap-3">
        {summary?.allocations.length ? summary.allocations.map((allocation) => (
          <AllocationCard
            key={allocation._id}
            allocation={allocation}
            onEdit={() => navigation.navigate("AddEditAllocation", { allocationId: allocation._id })}
            onDelete={() => confirmDelete(allocation._id)}
          />
        )) : <EmptyState title="No allocations yet" subtitle="Salary ko expenses, savings aur loan repayments mein plan karein." />}
      </View>
    </Screen>
  );
};
