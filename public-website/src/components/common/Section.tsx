import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export const Section = ({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) => (
  <section id={id} className={cn("px-4 py-10 sm:px-6 sm:py-12 lg:py-16", className)}>
    <div className="mx-auto w-full max-w-7xl">{children}</div>
  </section>
);
