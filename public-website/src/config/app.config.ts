export const APP_CONFIG = {
  appName: "Loan Tracker",
  apiBaseUrl: import.meta.env.VITE_API_URL || "http://localhost:5050/api",
  apkDownloadUrl: "https://github.com/abuzarkhan1/Loan-Tracker/releases/download/V1/application-ab85d34b-fa9d-4896-b5ed-4fe62645c5e3.apk",
  apkVersion: "V1",
  apkSize: "97.8 MB",
  lastUpdated: "May 28, 2026",
  androidCompatibility: "Android APK",
  supportEmail: "support@example.com",
  supportEmailHref: "mailto:support@example.com",
  contactPhone: "Coming soon",
  companyLocation: "Pakistan",
} as const;
