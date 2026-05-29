import { Linking, Share } from "react-native";
import { showAlert } from "../providers/AlertProvider";

export const shareText = async (message: string) => {
  await Share.share({ message });
};

export const shareToWhatsApp = async (message: string) => {
  const encoded = encodeURIComponent(message);
  const whatsappUrl = `whatsapp://send?text=${encoded}`;
  const webUrl = `https://wa.me/?text=${encoded}`;

  try {
    const supported = await Linking.canOpenURL(whatsappUrl);
    await Linking.openURL(supported ? whatsappUrl : webUrl);
  } catch {
    showAlert({ title: "Share failed", message: "WhatsApp open nahi ho saka." });
  }
};
