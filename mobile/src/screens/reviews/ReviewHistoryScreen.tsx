import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Text, TouchableOpacity } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { formatDate } from "../../utils/format";

export const ReviewHistoryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const query = useQuery({ queryKey: ["reviews"], queryFn: api.getReviews });
  if (query.isLoading) return <Screen><LoadingState label="Loading reviews..." /></Screen>;
  if (query.isError) return <Screen><ErrorState message="Review history load nahi ho saki." onRetry={query.refetch} /></Screen>;
  return (
    <Screen className="gap-4 pt-5">
      <Text className="text-2xl font-black text-dark">Review History</Text>
      {query.data?.length ? query.data.map((review) => (
        <TouchableOpacity
          key={review._id}
          activeOpacity={0.86}
          onPress={() => navigation.navigate("ReviewDetail", { reviewId: review._id })}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <Text className="text-sm font-black text-dark">{formatDate(review.cycleStartDate)} - {formatDate(review.cycleEndDate)}</Text>
          <Text className="mt-1 text-xs font-bold uppercase text-muted">{review.status}</Text>
        </TouchableOpacity>
      )) : <EmptyState title="No reviews yet" subtitle="Current cycle review generate karein." />}
    </Screen>
  );
};
