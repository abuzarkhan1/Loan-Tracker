import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export const Card = ({
  children,
  className,
  interactive = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; interactive?: boolean }) => (
  <div
    className={cn(
      "premium-card rounded-xl p-5",
      interactive && "transition duration-200 hover:-translate-y-1 hover:border-primary/35",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);
