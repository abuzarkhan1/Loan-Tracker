import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  X
} from "lucide-react-native";
import { useMemo, useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { api } from "../../api/client";
import { CalendarEvent } from "../../api/types";
import { MoneySummaryCard } from "../../components/MoneySummaryCard";
import { TimelineRow } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency, formatDate } from "../../utils/format";
import { fontFamily } from "../../utils/theme";
import { RootStackParamList } from "../../navigation/types";

const inflowTypes = ["SALARY_EXPECTED", "RECURRING_INCOME"];
const outflowTypes = ["BILL_DUE", "RECURRING_EXPENSE", "LOAN_DUE", "PROMISE_DUE", "INSTALLMENT_DUE", "SAVINGS_GOAL_DEADLINE"];

const eventLabel = (type: string) =>
  type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const dayKey = (date: string) => new Date(date).toISOString().slice(0, 10);

const groupEventsByDate = (events: CalendarEvent[]) =>
  events.reduce<Array<{ key: string; date: string; events: CalendarEvent[] }>>((groups, event) => {
    const key = dayKey(event.date);
    const existing = groups.find((group) => group.key === key);
    if (existing) {
      existing.events.push(event);
    } else {
      groups.push({ key, date: event.date, events: [event] });
    }
    return groups;
  }, []);

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const FinanceCalendarScreen = () => {
  const { theme, mode } = useAppTheme();
  useNavigation<NavigationProp>();

  // Month and Filter States
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth(); // 0-indexed in JS

  // Fetch month boundary ISO strings
  const startDate = new Date(year, month, 1).toISOString();
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();

  // Queries
  const eventsQuery = useQuery({ 
    queryKey: ["calendar", startDate, endDate], 
    queryFn: () => api.getCalendarEvents({ startDate, endDate }) 
  });
  
  const summaryQuery = useQuery({ 
    queryKey: ["calendar-summary", year, month + 1], 
    queryFn: () => api.getCalendarMonthSummary({ month: month + 1, year }) 
  });

  // Reset selected day filter when month changes
  useEffect(() => {
    setSelectedDay(null);
  }, [selectedDate]);

  const events = useMemo(() => eventsQuery.data || [], [eventsQuery.data]);
  const summary = summaryQuery.data;
  
  // Chronological event processing
  const groupedEvents = useMemo(() => groupEventsByDate(events), [events]);

  // Filter groupedEvents by tapped day if active
  const filteredGroupedEvents = useMemo(() => {
    if (selectedDay === null) return groupedEvents;
    return groupedEvents.filter((group) => {
      const date = new Date(group.date);
      return date.getDate() === selectedDay;
    });
  }, [groupedEvents, selectedDay]);

  // Extract only event days for the horizontal strip calendar (sorted chronologically)
  const activeEventDaysList = useMemo(() => {
    return groupedEvents.map((group) => {
      const date = new Date(group.date);
      const hasDanger = group.events.some((event) => event.severity === "DANGER" || event.severity === "WARNING");
      const hasInflow = group.events.some((event) => inflowTypes.includes(event.type));
      const hasOutflow = group.events.some((event) => outflowTypes.includes(event.type));
      return {
        dayNumber: date.getDate(),
        weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
        hasDanger,
        hasInflow,
        hasOutflow,
        key: group.key,
      };
    }).sort((a, b) => a.dayNumber - b.dayNumber);
  }, [groupedEvents]);

  if (eventsQuery.isLoading || summaryQuery.isLoading) {
    return <Screen><LoadingState label="Loading finance calendar..." /></Screen>;
  }
  
  if (eventsQuery.isError || summaryQuery.isError) {
    return (
      <Screen>
        <ErrorState 
          message="Calendar data load nahi ho saka." 
          onRetry={() => {
            eventsQuery.refetch();
            summaryQuery.refetch();
          }} 
        />
      </Screen>
    );
  }

  // Safe formatting / layout computations
  const monthLabel = selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const netProjection = summary?.netProjection || 0;

  // Month navigation
  const handlePrevMonth = () => {
    setSelectedDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(year, month + 1, 1));
  };

  return (
    <Screen className="gap-5 pt-5" refreshLabel="Refreshing calendar...">
      {/* Month Navigation & Screen Title */}
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>
            Finance Calendar
          </Text>
          <Text className="mt-1 text-sm font-semibold text-muted">
            Bills, salary, promises and goal dates.
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            activeOpacity={0.86}
            onPress={handlePrevMonth}
            className="h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card"
            style={theme.shadowSoft}
          >
            <ChevronLeft color={theme.primary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.86}
            onPress={handleNextMonth}
            className="h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card"
            style={theme.shadowSoft}
          >
            <ChevronRight color={theme.primary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Premium Dark Hero Card (Net Month Projection & Stats) */}
      <View
        className="overflow-hidden rounded-3xl border border-border p-5"
        style={{ backgroundColor: mode === "light" ? "#1a1625" : theme.card, ...theme.shadowSoft }}
      >
        <View className="absolute -right-20 -top-20 h-44 w-44 rounded-full opacity-10" style={{ backgroundColor: theme.primary }} />
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-[10px] font-black uppercase text-white/60" style={{ fontFamily: fontFamily.bold }}>
              Calendar Month
            </Text>
            <Text className="mt-1 text-2xl font-black text-white" style={{ fontFamily: fontFamily.extraBold }}>
              {monthLabel}
            </Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <CalendarDays color={theme.white} size={22} />
          </View>
        </View>

        <View className="mt-6">
          <Text className="text-[10px] font-black uppercase text-white/55" style={{ fontFamily: fontFamily.bold }}>
            Net Projection
          </Text>
          <Text className="mt-1 text-3xl font-black" style={{ color: netProjection >= 0 ? theme.white : theme.primary, fontFamily: fontFamily.extraBold }}>
            {formatCurrency(netProjection)}
          </Text>
        </View>

        <View className="mt-5 flex-row border-t border-white/10 pt-4">
          <View className="flex-1">
            <Text className="text-[10px] font-black uppercase text-white/55" style={{ fontFamily: fontFamily.bold }}>Events</Text>
            <Text className="mt-1 text-sm font-black text-white" style={{ fontFamily: fontFamily.extraBold }}>{events.length}</Text>
          </View>
          <View className="flex-1 border-l border-white/10 pl-4">
            <Text className="text-[10px] font-black uppercase text-white/55" style={{ fontFamily: fontFamily.bold }}>Important</Text>
            <Text className="mt-1 text-sm font-black text-white" style={{ fontFamily: fontFamily.extraBold }}>{summary?.importantEvents?.length || 0}</Text>
          </View>
        </View>
      </View>

      {/* Inflow & Outflow Row (Utilizes shared MoneySummaryCard for perfect 50/50 sizing and zero stretch) */}
      <View className="flex-row gap-3">
        <MoneySummaryCard 
          title="Inflow" 
          value={formatCurrency(summary?.expectedInflow || 0)} 
          subtitle="Expected this month" 
          icon={ArrowDownLeft} 
          tone="success" 
        />
        <MoneySummaryCard 
          title="Outflow" 
          value={formatCurrency(summary?.expectedOutflow || 0)} 
          subtitle="Planned payments" 
          icon={ArrowUpRight} 
          tone="danger" 
        />
      </View>

      {/* Active Dates Selector Calendar Strip */}
      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-base font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>
              Active Dates
            </Text>
            <Text className="mt-1 text-xs font-semibold text-muted">
              Tap a date to view its scheduled events
            </Text>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-background-soft">
            <CalendarDays color={theme.primary} size={20} />
          </View>
        </View>

        {activeEventDaysList.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 py-1">
            {activeEventDaysList.map((day) => {
              const isSelected = selectedDay === day.dayNumber;
              return (
                <TouchableOpacity
                  key={day.key}
                  activeOpacity={0.86}
                  onPress={() => setSelectedDay(isSelected ? null : day.dayNumber)}
                  className="items-center justify-center rounded-2xl border px-4 py-3"
                  style={{
                    minWidth: 58,
                    backgroundColor: isSelected 
                      ? theme.primary 
                      : day.hasDanger 
                        ? theme.peach 
                        : theme.backgroundSoft,
                    borderColor: isSelected 
                      ? theme.primary 
                      : day.hasDanger 
                        ? theme.primary 
                        : theme.border,
                    ...theme.shadowSoft,
                  }}
                >
                  <Text 
                    className="text-[10px] font-black uppercase text-muted" 
                    style={{ 
                      fontFamily: fontFamily.bold, 
                      color: isSelected 
                        ? theme.white 
                        : day.hasDanger 
                          ? theme.primary 
                          : theme.muted 
                    }}
                  >
                    {day.weekday}
                  </Text>
                  <Text 
                    className="mt-1 text-lg font-black text-dark" 
                    style={{ 
                      fontFamily: fontFamily.extraBold, 
                      color: isSelected ? theme.white : theme.text 
                    }}
                  >
                    {day.dayNumber}
                  </Text>
                  {/* Indicators below the number */}
                  <View className="flex-row gap-1 mt-1">
                    {day.hasInflow && (
                      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: isSelected ? theme.white : theme.success }} />
                    )}
                    {day.hasOutflow && (
                      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: isSelected ? theme.white : theme.danger }} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <EmptyState title="No event days" subtitle="Is month koi planned cash flow event nahi mila." />
        )}
      </View>

      {/* Agenda Timeline List Section */}
      <View className="gap-3 mt-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>
              Agenda
            </Text>
            <View className="rounded-full bg-background-soft px-2 py-0.5 border border-border">
              <Text className="text-[10px] font-black uppercase text-muted" style={{ fontFamily: fontFamily.bold }}>
                {events.length} item{events.length === 1 ? "" : "s"}
              </Text>
            </View>
          </View>
          {selectedDay !== null && (
            <TouchableOpacity
              activeOpacity={0.86}
              onPress={() => setSelectedDay(null)}
              className="flex-row items-center gap-1 bg-primary/10 rounded-full px-2.5 py-1"
            >
              <Text className="text-[10px] font-black text-primary uppercase" style={{ fontFamily: fontFamily.bold }}>
                Show All
              </Text>
              <X size={10} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>

        {filteredGroupedEvents.length ? (
          filteredGroupedEvents.map((group) => (
            <View key={group.key} className="gap-2.5">
              <Text className="text-xs font-black uppercase text-muted mt-2" style={{ fontFamily: fontFamily.bold }}>
                {formatDate(group.date)}
              </Text>
              {group.events.map((event) => {
                const isInflow = inflowTypes.includes(event.type);
                return (
                  <TimelineRow
                    key={`${event.type}-${event.id}`}
                    title={event.title}
                    subtitle={`${eventLabel(event.type)}${event.status ? ` • ${event.status.replace(/_/g, " ")}` : ""}`}
                    amount={event.amount}
                    tone={isInflow ? "inflow" : "outflow"}
                  />
                );
              })}
            </View>
          ))
        ) : (
          <EmptyState 
            title={selectedDay !== null ? "No events for this day" : "No events this month"} 
            subtitle={
              selectedDay !== null 
                ? "Is date pe koi scheduled cash flow nahi mila." 
                : "Bills, salary, promises aur recurring items yahan show hon ge."
            } 
          />
        )}
      </View>
    </Screen>
  );
};
