import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Share2, Trash2 } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { ReportStatus } from "../../api/types";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { showAlert } from "../../providers/AlertProvider";
import { formatDate, formatTime } from "../../utils/format";
import { fontFamily } from "../../utils/theme";
import { openReport, shareReport } from "./reportActions";

type Props = NativeStackScreenProps<RootStackParamList, "ReportHistory">;

const reportLabels: Record<string, string> = {
  CONTACT_STATEMENT: "Contact Statement",
  MONTHLY_REPORT: "Monthly Report",
  COMPLETE_HISTORY: "Complete History",
  EXCEL_LOANS: "Loans Export",
  EXCEL_PAYMENTS: "Payments Export",
  EXCEL_CONTACT: "Contact Export",
};

const statusStyle = (status: ReportStatus, theme: ReturnType<typeof useAppTheme>["theme"]) => {
  if (status === "COMPLETED") return { bg: theme.mint, color: theme.success };
  if (status === "FAILED") return { bg: theme.peach, color: theme.danger };
  if (status === "PROCESSING") return { bg: theme.yellow, color: theme.warning };
  return { bg: theme.backgroundSoft, color: theme.muted };
};

export const ReportHistoryScreen = ({}: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const reportsQuery = useQuery({
    queryKey: ["reports-history"],
    queryFn: () => api.getReports({ page: 1, limit: 50 }),
    refetchInterval: 8_000,
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteReport,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reports-history"] });
    },
  });

  const confirmDelete = (reportId: string) => {
    showAlert({
      title: "Delete report",
      message: "Report history se remove ho jayegi.",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(reportId) },
      ],
    });
  };

  if (reportsQuery.isLoading) return <Screen><LoadingState label="Loading reports..." /></Screen>;
  if (reportsQuery.isError || !reportsQuery.data) {
    return <Screen><ErrorState message="Report history load nahi ho saki." onRetry={reportsQuery.refetch} /></Screen>;
  }

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Report History</Text>
        <Text className="mt-1 text-sm font-medium text-muted">PDF aur Excel exports ka status.</Text>
      </View>

      <View className="mt-6 gap-3">
        {reportsQuery.data.reports.length ? reportsQuery.data.reports.map((report) => {
          const badge = statusStyle(report.status, theme);
          const completed = report.status === "COMPLETED";
          return (
            <View key={report._id} className="rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text style={{ color: theme.text, fontFamily: fontFamily.extraBold, fontSize: 16 }}>
                    {reportLabels[report.type]}
                  </Text>
                  <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 12, marginTop: 6 }}>
                    {formatDate(report.createdAt)} · {formatTime(report.createdAt)}
                  </Text>
                </View>
                <View style={{ borderRadius: 999, backgroundColor: badge.bg, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: badge.color, fontFamily: fontFamily.extraBold, fontSize: 11 }}>{report.status}</Text>
                </View>
              </View>

              {report.error ? <Text className="mt-3 text-sm font-semibold text-danger">{report.error}</Text> : null}

              <View className="mt-4 flex-row gap-2">
                <TouchableOpacity
                  disabled={!completed}
                  activeOpacity={0.85}
                  onPress={() => void openReport(report)}
                  className={`h-10 w-10 items-center justify-center rounded-lg ${completed ? "bg-background-soft" : "bg-border"}`}
                >
                  <Download color={completed ? theme.primary : theme.muted} size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={!completed}
                  activeOpacity={0.85}
                  onPress={() => void shareReport(report)}
                  className={`h-10 w-10 items-center justify-center rounded-lg ${completed ? "bg-background-soft" : "bg-border"}`}
                >
                  <Share2 color={completed ? theme.primary : theme.muted} size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => confirmDelete(report._id)}
                  className="h-10 w-10 items-center justify-center rounded-lg bg-peach"
                >
                  <Trash2 color={theme.danger} size={18} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }) : (
          <EmptyState title="No reports yet" subtitle="Generate PDF ya Excel export start karein." />
        )}
      </View>
    </Screen>
  );
};
