import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, UserRound } from "lucide-react-native";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const ContactsScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { theme } = useAppTheme();
  const [search, setSearch] = useState("");
  const contactsQuery = useQuery({
    queryKey: ["contacts", search],
    queryFn: () => api.getContacts({ search, limit: 50 }),
  });

  return (
    <Screen className="pt-5">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-black text-dark">Contacts</Text>
          <Text className="mt-1 text-sm font-medium text-muted">Jin logon ke saath hisaab hai.</Text>
        </View>
        <AppButton title="Add" icon={Plus} onPress={() => navigation.navigate("ContactForm")} />
      </View>

      <View
        className="mt-5 flex-row items-center gap-3 border border-border px-4"
        style={{ borderRadius: 14, backgroundColor: theme.input }}
      >
        <Search color={theme.muted} size={18} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search contacts"
          placeholderTextColor={theme.placeholder}
          className="h-12 flex-1 text-base text-dark"
        />
      </View>

      <View className="mt-5 gap-3">
        {contactsQuery.isLoading ? <LoadingState label="Loading contacts..." /> : null}
        {contactsQuery.isError ? <ErrorState message="Contacts load nahi ho sake." onRetry={contactsQuery.refetch} /> : null}
        {contactsQuery.data?.contacts.length === 0 ? (
          <EmptyState title="No contacts" subtitle="Add se pehla contact create karein." />
        ) : null}
        {contactsQuery.data?.contacts.map((contact) => (
          <TouchableOpacity
            key={contact._id}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("ContactDetail", { contactId: contact._id })}
            className="flex-row items-center gap-4 rounded-lg border border-border bg-card p-4"
            style={theme.shadowSoft}
          >
            <View className="h-11 w-11 items-center justify-center rounded-lg bg-background-soft">
              <UserRound color={theme.primary} size={22} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-dark">{contact.name}</Text>
              <Text className="mt-1 text-sm font-medium text-muted">{contact.phone || contact.email || "No phone"}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </Screen>
  );
};
