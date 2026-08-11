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
import { useState } from "react";
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
  // If true, this item is hidden for admin users (admins see a simpler nav)
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

  const filtered = NAV_ITEMS.filter((item) => {
    if (item.authOnly && !isAuthenticated) return false;
    if (item.driverOnly && user && user.role === "PASSENGER") return false;
    if (item.adminOnly && !isAdmin) return false;
    // Admins see a simplified nav (Dashboard + Admin + Safety)
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
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-6">
          <Logo size={36} onClick={() => handleNav("landing")} />
        </div>

        {/* Center: Primary nav (desktop) */}
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
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted",
                )}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="hidden xl:inline">{item.label}</span>
              </button>
            );
          })}

          {/* Admin button (only for admins) */}
          {isAuthenticated && isAdmin && (
            <button
              onClick={() => handleNav("admin")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                route.view === "admin"
                  ? "bg-foreground text-background shadow-sm"
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
          <button
            className="lg:hidden p-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background animate-in slide-in-from-top-2 duration-200">
          <div className="container mx-auto px-4 py-3 space-y-1">
            {filtered.map((item) => (
              <Button
                key={item.view}
                variant={route.view === item.view ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleNav(item.view)}
                className="w-full justify-start gap-2 rounded-full"
              >
                <item.icon className="size-4" />
                {item.label}
              </Button>
            ))}
            {isAuthenticated && isAdmin && (
              <Button
                variant={route.view === "admin" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleNav("admin")}
                className="w-full justify-start gap-2 rounded-full"
              >
                <ShieldCheck className="size-4" />
                Admin
              </Button>
            )}
            {!isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNav("signin")}
                  className="w-full justify-start rounded-full"
                >
                  Sign in
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleNav("signup")}
                  className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                >
                  Get started
                </Button>
              </>
            )}
            {isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNav("profile")}
                  className="w-full justify-start gap-2 rounded-full"
                >
                  My Profile
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOutUser}
                  className="w-full justify-start gap-2 rounded-full text-destructive"
                >
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
