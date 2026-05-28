import { zodResolver } from "@hookform/resolvers/zod";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Save } from "lucide-react-native";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { z } from "zod";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { FormInput } from "../../components/FormInput";
import { Screen } from "../../components/Screen";
import { LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { getErrorMessage } from "../../utils/errors";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().optional(),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, "ContactForm">;

export const ContactFormScreen = ({ navigation, route }: Props) => {
  const contactId = route.params?.contactId;
  const queryClient = useQueryClient();
  const isEditing = Boolean(contactId);
  const contactQuery = useQuery({
    queryKey: ["contact", contactId],
    queryFn: () => api.getContact(contactId!),
    enabled: isEditing,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", email: "", note: "" },
  });

  useEffect(() => {
    if (contactQuery.data?.contact) {
      reset({
        name: contactQuery.data.contact.name,
        phone: contactQuery.data.contact.phone || "",
        email: contactQuery.data.contact.email || "",
        note: contactQuery.data.contact.note || "",
      });
    }
  }, [contactQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEditing ? api.updateContact(contactId!, values) : api.createContact(values),
    onSuccess: async (contact) => {
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      await queryClient.invalidateQueries({ queryKey: ["contact", contact._id] });
      navigation.goBack();
    },
  });

  if (contactQuery.isLoading) return <Screen><LoadingState /></Screen>;

  return (
    <Screen className="gap-4 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">{isEditing ? "Edit Contact" : "Add Contact"}</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Naam aur basic details save karein.</Text>
      </View>

      <FormInput control={control} name="name" label="Name" placeholder="Ali Khan" error={errors.name?.message} />
      <FormInput control={control} name="phone" label="Phone" keyboardType="phone-pad" placeholder="03001234567" />
      <FormInput control={control} name="email" label="Email" autoCapitalize="none" keyboardType="email-address" placeholder="ali@example.com" error={errors.email?.message} />
      <FormInput control={control} name="note" label="Note" placeholder="Optional note" multiline />

      {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}
      <AppButton
        title={isEditing ? "Save Changes" : "Create Contact"}
        icon={Save}
        onPress={handleSubmit((values) => mutation.mutate(values))}
        loading={mutation.isPending}
      />
    </Screen>
  );
};
