"use client";

import {
  Compass,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Plus,
  Wallet,
  Menu,
  X,
  ShieldCheck,
  Calendar,
  Siren,
} from "lucide-react";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useNavigation, type ViewName } from "@/lib/store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UserAvatar } from "@/components/user-avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NavItem {
  label: string;
  view: ViewName;
  icon: React.ComponentType<{ className?: string }>;
  authOnly?: boolean;
  driverOnly?: boolean;
  adminOnly?: boolean;
  hideForAdmin?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Find a ride", view: "trips-search", icon: Compass, hideForAdmin: true },
  { label: "Offer a ride", view: "create-trip", icon: Plus, authOnly: true, driverOnly: true, hideForAdmin: true },
  { label: "Dashboard", view: "dashboard", icon: LayoutDashboard, authOnly: true, hideForAdmin: true },
  { label: "My Trips", view: "my-trips", icon: ListChecks, authOnly: true, driverOnly: true, hideForAdmin: true },
  { label: "Bookings", view: "bookings", icon: Calendar, authOnly: true, hideForAdmin: true },
  { label: "Wallet", view: "wallet", icon: Wallet, authOnly: true, driverOnly: true, hideForAdmin: true },
  { label: "Safety", view: "safety", icon: Siren, authOnly: true },
];

export function Navbar() {
  const { navigate, route } = useNavigation();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const [open, setOpen] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    const original = document.body.style.overflow;
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const filtered = NAV_ITEMS.filter((item) => {
    if (item.authOnly && !isAuthenticated) return false;
    if (item.driverOnly && user && user.role === "PASSENGER") return false;
    if (item.adminOnly && !isAdmin) return false;
    if (item.hideForAdmin && isAdmin) return false;
    return true;
  });

  const handleNav = (view: ViewName) => {
    navigate(view);
    setOpen(false);
  };

  const signOutUser = async () => {
    try {
      await signOut({ redirect: false });
      toast.success("Signed out");
      window.location.href = "/?view=landing";
    } catch (err) {
      console.error(err);
      toast.error("Failed to sign out");
    }
  };

  return (
    <>
      {/* Navbar — z-[1000] to stay above Leaflet maps (which use up to z-700) */}
      <header className="sticky top-0 z-[1000] w-full border-b border-border/60 bg-background shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          {/* Left: Logo */}
          <Logo size={36} onClick={() => handleNav("landing")} />

          {/* Center: Primary nav (desktop only) */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {filtered.map((item) => {
              const active = route.view === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => handleNav(item.view)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="hidden xl:inline">{item.label}</span>
                </button>
              );
            })}

            {isAuthenticated && isAdmin && (
              <button
                onClick={() => handleNav("admin")}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  route.view === "admin"
                    ? "bg-foreground text-background"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted",
                )}
                aria-current={route.view === "admin" ? "page" : undefined}
              >
                <ShieldCheck className="size-4 shrink-0" />
                <span className="hidden xl:inline">Admin</span>
              </button>
            )}
          </nav>

          {/* Right: Auth actions */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            {isLoading ? null : isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => handleNav("profile")}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-muted transition border border-border/60"
                  title="View profile"
                >
                  <UserAvatar
                    name={user?.name}
                    avatarUrl={user?.avatarUrl}
                    className="size-7"
                  />
                  <span className="text-sm font-semibold max-w-[100px] truncate">
                    {user?.name?.split(" ")[0] ?? "You"}
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOutUser}
                  aria-label="Sign out"
                  className="rounded-full"
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNav("signin")}
                  className="rounded-full"
                >
                  Sign in
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleNav("signup")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-semibold"
                >
                  Get started
                </Button>
              </div>
            )}
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 -mr-2"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — fixed overlay, doesn't push content down */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-[1100] flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Menu panel — slides from top, takes full width */}
          <div className="relative bg-background shadow-xl flex flex-col max-h-[85vh] overflow-y-auto">
            {/* Menu header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <Logo size={32} onClick={() => handleNav("landing")} />
              <button
                onClick={() => setOpen(false)}
                className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="size-6" />
              </button>
            </div>

            {/* Menu items */}
            <div className="px-4 py-3 space-y-1">
              {filtered.map((item) => {
                const active = route.view === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => handleNav(item.view)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <item.icon className="size-5 shrink-0" />
                    {item.label}
                  </button>
                );
              })}

              {isAuthenticated && isAdmin && (
                <button
                  onClick={() => handleNav("admin")}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    route.view === "admin"
                      ? "bg-foreground text-background"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <ShieldCheck className="size-5 shrink-0" />
                  Admin
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border/60 mx-4" />

            {/* Auth section */}
            <div className="px-4 py-3 space-y-1">
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => handleNav("signin")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-all"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => handleNav("signup")}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                  >
                    Get started
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNav("profile")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-all"
                  >
                    <UserAvatar
                      name={user?.name}
                      avatarUrl={user?.avatarUrl}
                      className="size-8"
                    />
                    <span className="truncate">{user?.name ?? "My Profile"}</span>
                  </button>
                  <button
                    onClick={signOutUser}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/5 transition-all"
                  >
                    <LogOut className="size-5 shrink-0" />
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
