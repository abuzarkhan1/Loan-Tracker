import { Download, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { APP_CONFIG } from "../../config/app.config";
import { navLinks } from "../../content/site.content";
import { cn } from "../../utils/cn";
import { BrandMark } from "../common/BrandMark";
import { ButtonLink } from "../common/ButtonLink";
import { ThemeToggle } from "../common/ThemeToggle";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-full px-4 py-2 text-sm font-extrabold transition duration-200",
    isActive ? "bg-peach text-primary-dark" : "text-muted hover:bg-background-soft hover:text-dark",
  );

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 px-3 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto max-w-7xl">
        <nav className="premium-card flex min-h-[68px] items-center justify-between gap-2 rounded-full px-3 py-2 sm:min-h-[76px] sm:px-4">
          <BrandMark />

          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.slice(0, 5).map((link) => (
              <NavLink key={link.href} to={link.href} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle />
            <ButtonLink href={APP_CONFIG.apkDownloadUrl} icon={Download} size="md">
              Download APK
            </ButtonLink>
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:hidden max-[380px]:gap-1.5">
            <ThemeToggle compact />
            <button
              type="button"
              aria-label={open ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
              className="grid size-11 place-items-center rounded-full border border-border bg-card text-dark shadow-soft transition hover:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/20 sm:size-12"
            >
              {open ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </nav>

        {open ? (
          <div className="premium-card mt-3 rounded-xl p-3 lg:hidden">
            <div className="grid gap-1">
              {navLinks.map((link) => (
                <NavLink key={link.href} to={link.href} className={linkClass}>
                  {link.label}
                </NavLink>
              ))}
            </div>
            <ButtonLink href={APP_CONFIG.apkDownloadUrl} icon={Download} className="mt-3 w-full">
              Download Android APK
            </ButtonLink>
          </div>
        ) : null}
      </div>
    </header>
  );
};
