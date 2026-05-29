import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, ReceiptText, Share2, Trash2 } from "lucide-react-native";
import { Text, View } from "react-native";
import { api, getAssetUrl } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { StatusBadge } from "../../components/StatusBadge";
import { RootStackParamList } from "../../navigation/types";
import { showAlert } from "../../providers/AlertProvider";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { formatDate } from "../../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "ReceiptPreview">;

export const ReceiptPreviewScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const { receiptId } = route.params;
  const receiptQuery = useQuery({ queryKey: ["receipt", receiptId], queryFn: () => api.getReceipt(receiptId) });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteReceipt(receiptId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["receipts"] });
      navigation.goBack();
    },
  });

  const shareReceipt = async () => {
    const receipt = receiptQuery.data;
    const url = getAssetUrl(receipt?.pdfUrl);
    if (!url) return;
    const target = `${FileSystem.cacheDirectory}${receipt?.fileName || `${receiptId}.pdf`}`;
    const result = await FileSystem.downloadAsync(url, target);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(result.uri);
    }
  };

  const confirmDelete = () => {
    showAlert({
      title: "Delete receipt",
      message: "Receipt history se yeh receipt remove ho jayegi.",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() },
      ],
    });
  };

  if (receiptQuery.isLoading) return <Screen><LoadingState label="Loading receipt..." /></Screen>;
  if (receiptQuery.isError || !receiptQuery.data) {
    return <Screen><ErrorState message="Receipt load nahi ho saka." onRetry={receiptQuery.refetch} /></Screen>;
  }

  const receipt = receiptQuery.data;
  return (
    <Screen className="pt-5">
      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-peach">
            <ReceiptText color={theme.primaryDark} size={26} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-black text-dark">{receipt.title}</Text>
            <Text className="mt-1 text-sm font-semibold text-muted">{receipt.receiptNumber}</Text>
          </View>
          <StatusBadge value={receipt.status} />
        </View>

        <View className="mt-6 rounded-2xl bg-background-soft p-5">
          <Text className="text-xs font-black uppercase text-muted">Receipt Preview</Text>
          <Text className="mt-3 text-base font-black text-dark">{receipt.type.replace(/_/g, " ")}</Text>
          <Text className="mt-2 text-sm font-semibold text-muted">Generated {formatDate(receipt.createdAt)}</Text>
          {receipt.fileName ? <Text className="mt-2 text-xs font-bold text-primary">{receipt.fileName}</Text> : null}
          {receipt.error ? <Text className="mt-3 text-sm font-semibold text-danger">{receipt.error}</Text> : null}
        </View>

        {deleteMutation.isError ? (
          <Text className="mt-3 text-sm font-semibold text-danger">{getErrorMessage(deleteMutation.error)}</Text>
        ) : null}

        <View className="mt-5 gap-3">
          <AppButton title="Share PDF" icon={Share2} disabled={!receipt.pdfUrl} onPress={shareReceipt} />
          <AppButton title="Download / Open" icon={Download} variant="secondary" disabled={!receipt.pdfUrl} onPress={shareReceipt} />
          <AppButton title="Delete" icon={Trash2} variant="danger" loading={deleteMutation.isPending} onPress={confirmDelete} />
        </View>
      </View>
    </Screen>
  );
};
