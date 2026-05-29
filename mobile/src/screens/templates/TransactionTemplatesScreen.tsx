import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Plus, Trash2, Zap } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { PlanningCard } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const TransactionTemplatesScreen = () => {
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["transaction-templates"], queryFn: () => api.getTransactionTemplates({ limit: 50 }) });
  const useTemplate = useMutation({
    mutationFn: (id: string) => api.useTransactionTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });
  const favorite = useMutation({
    mutationFn: (payload: { id: string; isFavorite: boolean }) => api.updateTransactionTemplate(payload.id, { isFavorite: payload.isFavorite }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transaction-templates"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteTransactionTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transaction-templates"] }),
  });
  if (query.isLoading) return <Screen><LoadingState label="Loading templates..." /></Screen>;
  if (query.isError) return <Screen><ErrorState message="Templates load nahi ho sakay." onRetry={query.refetch} /></Screen>;
  const templates = query.data?.templates || [];
  return (
    <Screen className="gap-5 pt-5">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-2xl font-black text-dark">Templates</Text>
          <Text className="mt-1 text-sm font-semibold text-muted">Common transactions one tap mein add karein.</Text>
        </View>
        <AppButton title="Add" icon={Plus} onPress={() => navigation.navigate("CreateEditTransactionTemplate")} />
      </View>
      {templates.length ? templates.map((template) => (
        <View key={template._id} className="gap-3">
          <PlanningCard title={template.title} subtitle={template.type} amount={template.amount} badge={template.isFavorite ? "Favorite" : undefined} />
          <View className="flex-row gap-3">
            <AppButton title="Use" icon={Zap} loading={useTemplate.isPending} onPress={() => useTemplate.mutate(template._id)} />
            <AppButton title={template.isFavorite ? "Unfav" : "Fav"} variant="secondary" icon={Heart} loading={favorite.isPending} onPress={() => favorite.mutate({ id: template._id, isFavorite: !template.isFavorite })} />
            <AppButton title="Edit" variant="secondary" onPress={() => navigation.navigate("CreateEditTransactionTemplate", { templateId: template._id })} />
            <AppButton title="Del" variant="secondary" icon={Trash2} loading={remove.isPending} onPress={() => remove.mutate(template._id)} />
          </View>
        </View>
      )) : <EmptyState title="No templates yet" subtitle="Lunch, fuel, mobile package ya freelance income ke templates banayein." />}
    </Screen>
  );
};
