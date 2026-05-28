import type { LucideIcon } from "lucide-react";
import { Download } from "lucide-react";
import { APP_CONFIG } from "../../config/app.config";
import { ButtonLink } from "./ButtonLink";

type DownloadApkButtonProps = {
  children?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "dark";
  icon?: LucideIcon;
};

export const DownloadApkButton = ({
  children = "Download Android APK",
  className,
  size = "md",
  variant = "primary",
  icon = Download,
}: DownloadApkButtonProps) => (
  <ButtonLink
    href={APP_CONFIG.apkDownloadUrl}
    icon={icon}
    size={size}
    variant={variant}
    className={className}
    ariaLabel={`${children} - ${APP_CONFIG.appName} ${APP_CONFIG.apkVersion}`}
  >
    {children}
  </ButtonLink>
);
