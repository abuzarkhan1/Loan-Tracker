import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Detect Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Dynamically load expo-notifications to prevent crash on module import in Expo Go on Android
const getNotifications = () => {
  if (isExpoGo && Platform.OS === "android") {
    return null;
  }
  try {
    return require("expo-notifications");
  } catch (error) {
    console.warn("Failed to load expo-notifications module:", error);
    return null;
  }
};

const Notifications = getNotifications();

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const getProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ||
  Constants.easConfig?.projectId ||
  Constants.expoConfig?.extra?.projectId;

export const getDeviceTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Karachi";

export const getNotificationPermissionStatus = async () => {
  if (!Notifications) {
    return "undetermined";
  }
  const permissions = await Notifications.getPermissionsAsync();
  return permissions.status;
};

export const registerForPushNotificationsAsync = async () => {
  if (isExpoGo && Platform.OS === "android") {
    throw new Error(
      "Push notifications are not supported in Expo Go on Android for SDK 53+. Please use a development build."
    );
  }

  if (!Notifications) {
    throw new Error("Notifications module is not available in this environment.");
  }

  if (!Device.isDevice) {
    throw new Error("Push notifications require a physical device or a supported Android build.");
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Loan reminders",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#f36f56",
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let finalStatus = current.status;

  if (current.status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== "granted") {
    throw new Error("Notification permission is disabled.");
  }

  const projectId = getProjectId();
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return token.data;
};
