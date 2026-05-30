// AppShell — narrow 56px icon-only sidebar wrapping all authenticated pages
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Sparkles,
  Home,
  FolderOpen,
  Bell,
  Play,
  HelpCircle,
  LogOut,
  Menu,
  Globe,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isPaidUser } from "@/types/types";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop narrow sidebar */}
      <aside className="hidden md:flex flex-col w-14 shrink-0 bg-background border-r border-border/60 z-20">
        <SidebarInner onNav={() => {}} />
      </aside>

      {/* Mobile hamburger + drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="md:hidden fixed top-3 left-3 z-50 w-9 h-9 flex items-center justify-center rounded-lg bg-background border border-border/60 shadow"
          >
            <Menu className="w-4 h-4 text-foreground" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-14 p-0 bg-background border-r border-border/60">
          <SidebarInner onNav={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}

function SidebarInner({ onNav }: { onNav: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, tokenBalance, signOut } = useAuth();

  const displayName = profile?.username || user?.email?.split("@")[0] || "U";
  const initial = displayName.charAt(0).toUpperCase();

  const topNavItems = [
    { icon: Home,       label: "Home",     path: "/home" },
    { icon: FolderOpen, label: "Projects", path: "/dashboard" },
    { icon: Globe,      label: "Domain",   path: "/domain", isPro: true },
  ];

  const go = (path: string) => { navigate(path); onNav(); };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-full items-center py-3 gap-1">
        {/* Logo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => go("/home")}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary shrink-0 mb-2 hover:opacity-90 transition-opacity"
              aria-label="SiteGenie Home"
            >
              <img src="/logo-icon.svg" alt="SiteGenie" style={{ width: 24, height: 24 }} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">SiteGenie</TooltipContent>
        </Tooltip>

        {/* User avatar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => go("/subscription")}
              className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary hover:bg-primary/30 transition-colors shrink-0 mb-1"
              aria-label="Profile"
            >
              {initial}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{displayName}</TooltipContent>
        </Tooltip>

        <div className="w-6 h-px bg-border/60 my-1 shrink-0" />

        {/* Top nav icons */}
        {topNavItems.map(({ icon: Icon, label, path, isPro }) => {
          const isActive = location.pathname === path || (path === "/home" && location.pathname === "/");
          const hasPaid = isPaidUser(profile);
          return (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => go(path)}
                  aria-label={label}
                  className={cn(
                    "relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                  {/* Pro badge dot for unpaid users */}
                  {isPro && !hasPaid && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary border border-background">
                      <Crown className="sr-only" />
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {label}
                {isPro && !hasPaid && <span className="ml-1 text-primary font-medium">(Pro)</span>}
              </TooltipContent>
            </Tooltip>
          );
        })}

        <div className="flex-1" />

        {/* Credits */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => go("/subscription")}
              className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors px-1"
              aria-label="Credits"
            >
              <span className="text-[11px] font-bold leading-none text-foreground">{tokenBalance > 999 ? `${Math.floor(tokenBalance / 1000)}k` : tokenBalance}</span>
              <span className="text-[8px] leading-none text-muted-foreground">Credits</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{tokenBalance} tokens — Buy more</TooltipContent>
        </Tooltip>

        <div className="w-6 h-px bg-border/60 my-1 shrink-0" />

        {/* Bell */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell style={{ width: 18, height: 18 }} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Notifications</TooltipContent>
        </Tooltip>

        {/* Video/Tutorials */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Tutorials"
            >
              <Play style={{ width: 18, height: 18 }} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Tutorials</TooltipContent>
        </Tooltip>

        {/* Help */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Help"
            >
              <HelpCircle style={{ width: 18, height: 18 }} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Help</TooltipContent>
        </Tooltip>

        {/* Sign out */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={async () => { await signOut(); navigate("/"); onNav(); }}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Sign Out"
            >
              <LogOut style={{ width: 18, height: 18 }} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Sign Out</TooltipContent>
        </Tooltip>

        {/* User avatar circle at bottom */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => go("/subscription")}
              className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-[11px] font-bold text-background hover:opacity-80 transition-opacity shrink-0 mt-1"
              aria-label="Account"
            >
              {initial}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Account</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
