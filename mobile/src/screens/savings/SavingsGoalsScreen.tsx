import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign, Pencil, PiggyBank, Plus, Trash2 } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { SavingsGoal } from "../../api/types";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { showAlert } from "../../providers/AlertProvider";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency, formatDate } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const GoalCard = ({
  goal,
  onAddProgress,
  onEdit,
  onDelete,
}: {
  goal: SavingsGoal;
  onAddProgress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const { theme } = useAppTheme();
  const progress = goal.progressPercent ?? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  return (
    <View className="rounded-3xl border border-border bg-card p-4" style={theme.shadowSoft}>
      <View className="flex-row items-start gap-4">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-background-soft">
          <PiggyBank color={theme.primary} size={22} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-black text-dark">{goal.name}</Text>
          <Text className="mt-1 text-xs font-semibold text-muted">
            {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
          </Text>
          {goal.deadline ? <Text className="mt-1 text-xs font-semibold text-muted">Deadline {formatDate(goal.deadline)}</Text> : null}
        </View>
        <TouchableOpacity onPress={onAddProgress} className="h-9 w-9 items-center justify-center rounded-full bg-background-soft">
          <CircleDollarSign color={theme.success} size={16} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onEdit} className="h-9 w-9 items-center justify-center rounded-full bg-background-soft">
          <Pencil color={theme.primary} size={16} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} className="h-9 w-9 items-center justify-center rounded-full bg-background-soft">
          <Trash2 color={theme.danger} size={16} />
        </TouchableOpacity>
      </View>
      <View className="mt-4">
        <ProgressBar progress={progress} />
        <Text className="mt-2 text-xs font-bold text-muted">{progress}% complete · {goal.status}</Text>
      </View>
    </View>
  );
};

export const SavingsGoalsScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const goalsQuery = useQuery({ queryKey: ["savings-goals"], queryFn: () => api.getSavingsGoals() });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSavingsGoal(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      await queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });

  const confirmDelete = (id: string) => showAlert({
    title: "Delete goal?",
    message: "Savings goal remove ho jayega.",
    buttons: [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(id) }],
  });

  return (
    <Screen className="gap-5 pt-5">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Savings Goals</Text>
          <Text className="mt-1 text-sm font-medium text-muted">Targets aur progress simple tarike se.</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.86}
          onPress={() => navigation.navigate("AddEditSavingsGoal")}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-primary"
          style={theme.shadowSoft}
        >
          <Plus color={theme.white} size={22} />
        </TouchableOpacity>
      </View>
      {goalsQuery.isLoading ? <LoadingState label="Loading goals..." /> : null}
      {goalsQuery.isError ? <ErrorState message="Savings goals load nahi ho sake." onRetry={goalsQuery.refetch} /> : null}
      <View className="gap-3">
        {goalsQuery.data?.length ? goalsQuery.data.map((goal) => (
          <GoalCard
            key={goal._id}
            goal={goal}
            onAddProgress={() => navigation.navigate("AddSavingsProgress", { goalId: goal._id })}
            onEdit={() => navigation.navigate("AddEditSavingsGoal", { goalId: goal._id })}
            onDelete={() => confirmDelete(goal._id)}
          />
        )) : !goalsQuery.isLoading && !goalsQuery.isError ? (
          <EmptyState title="No savings goals" subtitle="Target set karein aur progress track karein." />
        ) : null}
      </View>
    </Screen>
  );
};
