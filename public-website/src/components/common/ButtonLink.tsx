import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";
type ButtonSize = "sm" | "md" | "lg";

type ButtonLinkProps = {
  children: ReactNode;
  to?: string;
  href?: string;
  icon?: LucideIcon;
  trailingIcon?: LucideIcon;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  ariaLabel?: string;
  onClick?: () => void;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-primary bg-primary text-white shadow-primary-glow hover:bg-primary-dark hover:border-primary-dark",
  secondary:
    "border-border bg-card text-dark shadow-soft hover:border-primary/40 hover:bg-background-soft",
  ghost: "border-transparent bg-transparent text-primary hover:bg-peach",
  dark: "border-[#2b2631] bg-[#2b2631] text-[#f5f0eb] hover:bg-[#332d3a] dark:border-border dark:bg-card",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-5 text-sm",
  md: "min-h-12 px-6 text-sm",
  lg: "min-h-[52px] px-6 text-sm sm:min-h-[54px] sm:px-7 sm:text-[15px]",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full border font-extrabold transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-primary/20";

export const ButtonLink = ({
  children,
  to,
  href,
  icon: Icon,
  trailingIcon: TrailingIcon,
  variant = "primary",
  size = "md",
  className,
  ariaLabel,
  onClick,
}: ButtonLinkProps) => {
  const content = (
    <>
      {Icon ? <Icon size={18} strokeWidth={2.4} /> : null}
      <span>{children}</span>
      {TrailingIcon ? <TrailingIcon size={18} strokeWidth={2.4} /> : null}
    </>
  );
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

  if (to) {
    return (
      <Link to={to} className={classes} aria-label={ariaLabel} onClick={onClick}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} aria-label={ariaLabel} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={classes} aria-label={ariaLabel} onClick={onClick}>
      {content}
    </button>
  );
};
