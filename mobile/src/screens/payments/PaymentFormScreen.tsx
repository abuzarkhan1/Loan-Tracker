import { zodResolver } from "@hookform/resolvers/zod";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Camera, Image as ImageIcon, Save, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { z } from "zod";
import { api, getAssetUrl } from "../../api/client";
import { PaymentMethod } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { DatePickerField } from "../../components/DatePickerField";
import { FormInput } from "../../components/FormInput";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { showAlert } from "../../providers/AlertProvider";
import { getErrorMessage } from "../../utils/errors";
import { formatCurrency, toDateInput } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

const schema = z.object({
  amount: z.string().min(1, "Amount required").refine((value) => Number(value) > 0, "Amount must be greater than 0"),
  method: z.enum(["CASH", "BANK", "JAZZCASH", "EASYPAISA", "OTHER"]),
  paymentDate: z.string().optional(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, "PaymentForm">;

const methodOptions: { label: string; value: PaymentMethod }[] = [
  { label: "Cash", value: "CASH" },
  { label: "Bank", value: "BANK" },
  { label: "JazzCash", value: "JAZZCASH" },
  { label: "EasyPaisa", value: "EASYPAISA" },
  { label: "Other", value: "OTHER" },
];

export const PaymentFormScreen = ({ navigation, route }: Props) => {
  const { loanId, paymentId } = route.params;
  const isEditing = Boolean(paymentId);
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const [selectedProof, setSelectedProof] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const loanQuery = useQuery({
    queryKey: ["loan", loanId],
    queryFn: () => api.getLoan(loanId),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      method: "CASH",
      paymentDate: toDateInput(new Date()),
      note: "",
    },
  });

  const existingPayment = loanQuery.data?.payments.find((payment) => payment._id === paymentId);

  useEffect(() => {
    if (existingPayment) {
      reset({
        amount: String(existingPayment.amount),
        method: existingPayment.method,
        paymentDate: toDateInput(existingPayment.paymentDate),
        note: existingPayment.note || "",
      });
    }
  }, [existingPayment, reset]);

  const pickProof = async (source: "gallery" | "camera") => {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showAlert({ title: "Permission needed", message: "Proof image select karne ke liye permission required hai." });
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 0.8, mediaTypes: ImagePicker.MediaTypeOptions.Images })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (!result.canceled) {
      setSelectedProof(result.assets[0]);
    }
  };

  const proofUploadMutation = useMutation({
    mutationFn: (payload: { nextPaymentId: string; proof: ImagePicker.ImagePickerAsset }) =>
      api.uploadPaymentProof(payload.nextPaymentId, {
        uri: payload.proof.uri,
        name: payload.proof.fileName || `payment-proof-${Date.now()}.jpg`,
        type: payload.proof.mimeType || "image/jpeg",
      }),
  });

  const deleteProofMutation = useMutation({
    mutationFn: () => api.deletePaymentProof(paymentId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["loan", loanId] });
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        loanId,
        amount: Number(values.amount),
        method: values.method as PaymentMethod,
        paymentDate: values.paymentDate || undefined,
        note: values.note || undefined,
      };

      return isEditing ? api.updatePayment(paymentId!, payload) : api.addPayment(payload);
    },
    onSuccess: async (data) => {
      const nextPaymentId = data.payment?._id || paymentId;
      if (nextPaymentId && selectedProof) {
        await proofUploadMutation.mutateAsync({ nextPaymentId, proof: selectedProof });
      }
      const promiseSuggestion = data.promiseSuggestion;
      await queryClient.invalidateQueries({ queryKey: ["loan", loanId] });
      await queryClient.invalidateQueries({ queryKey: ["loans"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["promises"] });
      navigation.goBack();
      if (promiseSuggestion?.promiseId) {
        setTimeout(() => {
          showAlert({
            title: "Promise matched",
            message: promiseSuggestion.message,
            buttons: [
              { text: "Not Now", style: "cancel" },
              {
                text: "Mark Kept",
                onPress: async () => {
                  await api.markPromiseKept(promiseSuggestion.promiseId);
                  await queryClient.invalidateQueries({ queryKey: ["promises"] });
                  await queryClient.invalidateQueries({ queryKey: ["recovery"] });
                },
              },
            ],
          });
        }, 250);
      }
    },
  });

  if (loanQuery.isLoading) return <Screen><LoadingState label="Loading loan..." /></Screen>;

  const loan = loanQuery.data?.loan;
  const existingAmount = existingPayment?.amount || 0;
  const availableAmount = (loan?.remainingAmount || 0) + (isEditing ? existingAmount : 0);
  const paymentLabel = loan?.type === "TAKEN" ? "Maine diya" : "Wapis mila";
  const existingProofUrl = getAssetUrl(existingPayment?.proof?.fileUrl);
  const previewUri = selectedProof?.uri || existingProofUrl;

  return (
    <Screen className="gap-4 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">{isEditing ? "Edit Payment" : "Nayi Payment"}</Text>
        <Text className="mt-1 text-sm font-medium text-muted">
          {paymentLabel} · Available: {formatCurrency(availableAmount)}
        </Text>
      </View>

      <FormInput control={control} name="amount" label={`${paymentLabel} amount`} keyboardType="numeric" placeholder="5000" error={errors.amount?.message} />
      <Controller
        control={control}
        name="method"
        render={({ field: { onChange, value } }) => (
          <FormSelect label="Method" value={value} onChange={onChange} options={methodOptions} />
        )}
      />
      <Controller
        control={control}
        name="paymentDate"
        render={({ field: { onChange, value } }) => (
          <DatePickerField label="Payment Date" value={value} onChange={onChange} />
        )}
      />
      <FormInput control={control} name="note" label="Note" placeholder="Optional note" multiline />

      <View className="rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
        <Text style={{ color: theme.text, fontFamily: fontFamily.bold, fontSize: 15 }}>Payment Proof</Text>
        <Text style={{ color: theme.muted, fontFamily: fontFamily.medium, fontSize: 13, marginTop: 4 }}>
          Receipt ya screenshot optional attach karein.
        </Text>

        {previewUri ? (
          <View className="mt-4 overflow-hidden rounded-lg border border-border">
            <Image source={{ uri: previewUri }} style={{ width: "100%", height: 190, backgroundColor: theme.backgroundSoft }} resizeMode="cover" />
          </View>
        ) : null}

        <View className="mt-4 flex-row gap-3">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => void pickProof("gallery")}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-border bg-background-soft px-4 py-3"
          >
            <ImageIcon color={theme.primary} size={17} />
            <Text style={{ color: theme.text, fontFamily: fontFamily.bold, fontSize: 13 }}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => void pickProof("camera")}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-border bg-background-soft px-4 py-3"
          >
            <Camera color={theme.primary} size={17} />
            <Text style={{ color: theme.text, fontFamily: fontFamily.bold, fontSize: 13 }}>Camera</Text>
          </TouchableOpacity>
        </View>

        {selectedProof ? (
          <TouchableOpacity activeOpacity={0.85} onPress={() => setSelectedProof(null)} className="mt-3 flex-row items-center justify-center gap-2">
            <Trash2 color={theme.danger} size={16} />
            <Text style={{ color: theme.danger, fontFamily: fontFamily.bold, fontSize: 13 }}>Remove selected proof</Text>
          </TouchableOpacity>
        ) : existingPayment?.proof ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => deleteProofMutation.mutate()}
            className="mt-3 flex-row items-center justify-center gap-2"
          >
            <Trash2 color={theme.danger} size={16} />
            <Text style={{ color: theme.danger, fontFamily: fontFamily.bold, fontSize: 13 }}>Delete existing proof</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {(mutation.isError || proofUploadMutation.isError || deleteProofMutation.isError) ? (
        <Text className="text-sm font-semibold text-danger">
          {getErrorMessage(mutation.error || proofUploadMutation.error || deleteProofMutation.error)}
        </Text>
      ) : null}
      <AppButton
        title={isEditing ? "Save Payment" : "Add Payment"}
        icon={Save}
        loading={mutation.isPending || proofUploadMutation.isPending}
        onPress={handleSubmit((values) => mutation.mutate(values))}
      />
    </Screen>
  );
};
