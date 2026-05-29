import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { getAssetUrl } from "../../api/client";
import { Report } from "../../api/types";
import { showAlert } from "../../providers/AlertProvider";

export const openReport = async (report: Report) => {
  const url = getAssetUrl(report.fileUrl);
  if (!url) {
    showAlert({ title: "Report not ready", message: "File abhi generate nahi hui." });
    return;
  }

  try {
    const isExcel = report.type.startsWith("EXCEL");
    const mimeType = isExcel
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/pdf";
    const extension = isExcel ? "xlsx" : "pdf";
    const fileName = report.fileName || `${report.type.toLowerCase()}.${extension}`;

    // 1. Download to local cache
    const target = `${FileSystem.cacheDirectory || ""}${fileName}`;
    const downloaded = await FileSystem.downloadAsync(url, target);

    // 2. Android: Save directly to the device storage via SAF (Storage Access Framework)
    if (Platform.OS === "android") {
      const { StorageAccessFramework } = FileSystem;
      if (!StorageAccessFramework) {
        // Fallback to sharing if SAF is not available
        await Sharing.shareAsync(downloaded.uri);
        return;
      }

      // Request directory permission (user selects folder, e.g. Downloads)
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        showAlert({ title: "Permission denied", message: "File save karne ke liye permission chahiye." });
        return;
      }

      // Create file in the selected directory
      const newFileUri = await StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        mimeType
      );

      // Write contents to the newly created file
      const base64 = await FileSystem.readAsStringAsync(downloaded.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await StorageAccessFramework.writeAsStringAsync(newFileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      showAlert({ title: "Report saved", message: "File successfully saved to your selected directory." });
    } else {
      // iOS: Open native share/save sheet which allows direct saving/sharing
      await Sharing.shareAsync(downloaded.uri);
    }
  } catch (error) {
    console.error("Error downloading/saving report:", error);
    showAlert({ title: "Download failed", message: "Report download karne mein error aya." });
  }
};

export const shareReport = async (report: Report) => {
  const url = getAssetUrl(report.fileUrl);
  if (!url) {
    showAlert({ title: "Report not ready", message: "File abhi generate nahi hui." });
    return;
  }

  try {
    const isExcel = report.type.startsWith("EXCEL");
    const extension = isExcel ? "xlsx" : "pdf";
    const fileName = report.fileName || `${report.type.toLowerCase()}.${extension}`;
    const target = `${FileSystem.cacheDirectory || ""}${fileName}`;
    
    const downloaded = await FileSystem.downloadAsync(url, target);
    
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      showAlert({ title: "Sharing not available", message: "Is device par sharing setup nahi hai." });
      return;
    }

    await Sharing.shareAsync(downloaded.uri);
  } catch (error) {
    console.error("Error sharing report:", error);
    showAlert({ title: "Sharing failed", message: "Report share karne mein error aya." });
  }
};
