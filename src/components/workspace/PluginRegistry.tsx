import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Puzzle,
  Check,
  Plus,
  Minus,
  Paintbrush,
  Database,
  Lock,
  CreditCard,
  BarChart,
  TestTube,
  Sparkles,
  IndianRupee,
} from "lucide-react";
import type { Plugin } from "@/types/types";
import { cn } from "@/lib/utils";

const AVAILABLE_PLUGINS: Plugin[] = [
  {
    id: "tailwind",
    name: "Tailwind CSS",
    description: "Utility-first CSS framework for rapid UI development",
    icon: "Paintbrush",
    category: "styling",
    promptModifier: "Use Tailwind CSS classes for styling",
  },
  {
    id: "shadcn",
    name: "shadcn/ui",
    description: "Beautiful, accessible component library built on Radix UI",
    icon: "Sparkles",
    category: "styling",
    promptModifier: "Use shadcn/ui components (Button, Card, Input, etc.)",
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Open-source Firebase alternative — database, auth, storage",
    icon: "Database",
    category: "backend",
    promptModifier: "Include Supabase integration for data persistence",
  },
  {
    id: "firebase",
    name: "Firebase",
    description: "Google's app development platform — realtime database & hosting",
    icon: "Database",
    category: "backend",
    promptModifier: "Include Firebase Firestore for data storage",
  },
  {
    id: "auth",
    name: "Auth Kit",
    description: "Complete authentication with login, register, and OAuth",
    icon: "Lock",
    category: "auth",
    promptModifier: "Include user authentication with login/logout functionality",
  },
  {
    id: "stripe",
    name: "Stripe Payments",
    description: "Accept payments with Stripe Checkout integration",
    icon: "CreditCard",
    category: "payment",
    promptModifier: "Include Stripe payment integration with checkout",
  },
  {
    id: "razorpay",
    name: "Razorpay",
    description: "India's leading payment gateway — UPI, cards, net banking & wallets",
    icon: "IndianRupee",
    category: "payment",
    promptModifier: "Include Razorpay payment integration with order creation and verification via Supabase Edge Functions",
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Track user behavior with built-in analytics dashboard",
    icon: "BarChart",
    category: "analytics",
    promptModifier: "Include analytics tracking and dashboard",
  },
  {
    id: "testing",
    name: "Testing Suite",
    description: "Unit and integration tests with Vitest and Testing Library",
    icon: "TestTube",
    category: "testing",
    promptModifier: "Include unit tests for all components",
  },
];

const ICON_MAP: Record<string, React.ElementType> = {
  Paintbrush, Database, Lock, CreditCard, BarChart, TestTube, Sparkles, IndianRupee,
};

const CATEGORY_COLORS: Record<Plugin["category"], string> = {
  styling: "bg-chart-1/15 text-chart-1 border-chart-1/30",
  backend: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  auth: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  payment: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  analytics: "bg-primary/15 text-primary border-primary/30",
  testing: "bg-secondary/15 text-secondary border-secondary/30",
};

interface PluginRegistryProps {
  open: boolean;
  onClose: () => void;
  enabledPlugins: string[];
  onToggle: (pluginId: string) => void;
}

export function PluginRegistry({
  open,
  onClose,
  enabledPlugins,
  onToggle,
}: PluginRegistryProps) {
  const [filter, setFilter] = useState<Plugin["category"] | "all">("all");

  const filtered = filter === "all"
    ? AVAILABLE_PLUGINS
    : AVAILABLE_PLUGINS.filter((p) => p.category === filter);

  const categories: { id: Plugin["category"] | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "styling", label: "Styling" },
    { id: "backend", label: "Backend" },
    { id: "auth", label: "Auth" },
    { id: "payment", label: "Payment" },
    { id: "analytics", label: "Analytics" },
    { id: "testing", label: "Testing" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden gap-0 p-0">
        <DialogHeader className="px-4 py-3 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Puzzle className="w-4 h-4 text-primary" />
            Plugin Registry
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Enable plugins to enhance AI-generated code. Active plugins modify prompts automatically.
          </p>
        </DialogHeader>

        {/* Category filter */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border overflow-x-auto shrink-0">
          {categories.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-all",
                filter === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
          {enabledPlugins.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-[10px] shrink-0">
              {enabledPlugins.length} active
            </Badge>
          )}
        </div>

        {/* Plugin grid */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((plugin) => {
              const isEnabled = enabledPlugins.includes(plugin.id);
              const Icon = ICON_MAP[plugin.icon] ?? Puzzle;
              return (
                <div
                  key={plugin.id}
                  className={cn(
                    "relative border rounded-xl p-4 transition-all flex flex-col gap-2",
                    isEnabled
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/60 bg-card hover:border-border"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isEnabled ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Icon className={cn("w-4 h-4", isEnabled ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold truncate">{plugin.name}</h3>
                        {isEnabled && (
                          <Badge className="text-[9px] bg-primary/20 text-primary border-primary/30 h-4">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 text-pretty">
                        {plugin.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border capitalize font-medium",
                      CATEGORY_COLORS[plugin.category]
                    )}>
                      {plugin.category}
                    </span>
                    <Button
                      size="sm"
                      variant={isEnabled ? "ghost" : "default"}
                      className={cn(
                        "h-7 px-3 text-xs gap-1.5",
                        isEnabled
                          ? "border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/40"
                          : "bg-primary text-primary-foreground"
                      )}
                      onClick={() => onToggle(plugin.id)}
                    >
                      {isEnabled ? (
                        <><Minus className="w-3 h-3" /> Remove</>
                      ) : (
                        <><Plus className="w-3 h-3" /> Add</>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        {enabledPlugins.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border bg-primary/5 shrink-0">
            <p className="text-xs text-primary flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {enabledPlugins.length} plugin{enabledPlugins.length !== 1 ? "s" : ""} will be applied to your next AI generation
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
