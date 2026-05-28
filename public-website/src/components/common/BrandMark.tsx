import { Link } from "react-router-dom";
import logoUrl from "../../assets/logo.png";
import { APP_CONFIG } from "../../config/app.config";
import { cn } from "../../utils/cn";

export const BrandMark = ({ compact = false, className }: { compact?: boolean; className?: string }) => (
  <Link to="/" className={cn("inline-flex items-center gap-3", className)} aria-label={`${APP_CONFIG.appName} home`}>
    <span className="grid size-11 shrink-0 overflow-hidden rounded-[14px] border border-border bg-card shadow-soft sm:size-12 sm:rounded-[15px]">
      <img src={logoUrl} alt="" className="size-full object-contain" />
    </span>
    {compact ? null : (
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-extrabold text-dark sm:text-base">{APP_CONFIG.appName}</span>
        <span className="block truncate text-[11px] font-bold text-muted sm:text-xs max-[390px]:hidden">Personal loan clarity</span>
      </span>
    )}
  </Link>
);
