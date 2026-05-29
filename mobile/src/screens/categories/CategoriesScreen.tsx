import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EyeOff, Pencil, Plus } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { Category } from "../../api/types";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { showAlert } from "../../providers/AlertProvider";
import { useAppTheme } from "../../providers/ThemeProvider";
import { fontFamily } from "../../utils/theme";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const CategoryCard = ({ category, onEdit, onHide }: { category: Category; onEdit: () => void; onHide: () => void }) => {
  const { theme } = useAppTheme();
  return (
    <View className="flex-row items-center gap-4 rounded-3xl border border-border bg-card p-4" style={theme.shadowSoft}>
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-background-soft">
        <Text className="text-lg font-black text-primary">{category.icon || category.name.charAt(0)}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-black text-dark">{category.name}</Text>
        <Text className="mt-1 text-xs font-semibold text-muted">
          {category.isDefault ? "Default" : "Custom"} · {category.isActive ? "Active" : "Hidden"}
        </Text>
      </View>
      <TouchableOpacity activeOpacity={0.86} onPress={onEdit} className="h-10 w-10 items-center justify-center rounded-full bg-background-soft">
        <Pencil color={theme.primary} size={17} />
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.86} onPress={onHide} className="h-10 w-10 items-center justify-center rounded-full bg-background-soft">
        <EyeOff color={theme.muted} size={17} />
      </TouchableOpacity>
    </View>
  );
};

export const CategoriesScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const categoriesQuery = useQuery({
    queryKey: ["categories", type, "all"],
    queryFn: () => api.getCategories({ type, includeInactive: true }),
  });
  const updateMutation = useMutation({
    mutationFn: (category: Category) => api.updateCategory(category._id, { isActive: !category.isActive }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const toggleActive = (category: Category) => {
    showAlert({
      title: category.isActive ? "Hide category?" : "Show category?",
      message: category.isActive ? "Ye category picker se hide ho jayegi." : "Ye category picker mein dobara show ho jayegi.",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", onPress: () => updateMutation.mutate(category) },
      ],
    });
  };

  return (
    <Screen className="gap-5 pt-5">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Categories</Text>
          <Text className="mt-1 text-sm font-medium text-muted">Income aur expense categories.</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.86}
          onPress={() => navigation.navigate("AddEditCategory", { type })}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-primary"
          style={theme.shadowSoft}
        >
          <Plus color={theme.white} size={22} />
        </TouchableOpacity>
      </View>

      <View className="flex-row gap-2">
        {(["EXPENSE", "INCOME"] as const).map((option) => {
          const active = option === type;
          return (
            <TouchableOpacity
              key={option}
              activeOpacity={0.86}
              onPress={() => setType(option)}
              className="flex-1 rounded-full border py-3"
              style={{ borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : theme.pill }}
            >
              <Text className="text-center text-sm font-black" style={{ color: active ? theme.white : theme.muted }}>
                {option === "EXPENSE" ? "Expense" : "Income"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {categoriesQuery.isLoading ? <LoadingState label="Loading categories..." /> : null}
      {categoriesQuery.isError ? <ErrorState message="Categories load nahi ho sake." onRetry={categoriesQuery.refetch} /> : null}

      <View className="gap-3">
        {categoriesQuery.data?.length ? categoriesQuery.data.map((category) => (
          <CategoryCard
            key={category._id}
            category={category}
            onEdit={() => navigation.navigate("AddEditCategory", { categoryId: category._id, type: category.type })}
            onHide={() => toggleActive(category)}
          />
        )) : !categoriesQuery.isLoading && !categoriesQuery.isError ? (
          <EmptyState title="No categories" subtitle="Custom category add karein." />
        ) : null}
      </View>
    </Screen>
  );
};
