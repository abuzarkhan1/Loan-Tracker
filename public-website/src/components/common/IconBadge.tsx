import type { LucideIcon } from "lucide-react";
import { cn } from "../../utils/cn";

export type Tone = "primary" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  primary: "bg-background-soft text-primary",
  success: "bg-mint text-success",
  warning: "bg-yellow text-warning",
  danger: "bg-peach text-primary-dark",
};

export const IconBadge = ({
  icon: Icon,
  tone = "primary",
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  className?: string;
}) => (
  <span className={cn("grid size-12 place-items-center rounded-[14px] border border-border/40", toneClasses[tone], className)}>
    <Icon size={20} strokeWidth={2.4} />
  </span>
);
