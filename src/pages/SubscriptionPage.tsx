import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/db/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowLeft,
  Coins,
  CheckCircle,
  Loader2,
  Zap,
  Crown,
  Star,
  TrendingUp,
  Clock,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface TokenPackage {
  amountPaise: number;
  amountDisplay: string;
  tokens: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  popular?: boolean;
  savings?: string;
}

const PACKAGES: TokenPackage[] = [
  {
    amountPaise: 30000,
    amountDisplay: "₹300",
    tokens: 600,
    label: "Starter",
    icon: Zap,
  },
  {
    amountPaise: 50000,
    amountDisplay: "₹500",
    tokens: 1000,
    label: "Basic",
    icon: Star,
    popular: true,
  },
  {
    amountPaise: 100000,
    amountDisplay: "₹1,000",
    tokens: 2000,
    label: "Pro",
    icon: Crown,
    savings: "Save ₹100",
  },
  {
    amountPaise: 500000,
    amountDisplay: "₹5,000",
    tokens: 9000,
    label: "Enterprise",
    icon: TrendingUp,
    savings: "Save ₹1,500",
  },
];

interface Transaction {
  id: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

// Dynamically load Razorpay script
function useRazorpayScript() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (window.Razorpay) { setLoaded(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);
  return loaded;
}

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user, profile, tokenBalance, refreshTokenBalance, loading: authLoading } = useAuth();
  const razorpayReady = useRazorpayScript();

  const [processing, setProcessing] = useState<number | null>(null); // amountPaise of the package being processed
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  const displayName = profile?.username || user?.email?.split("@")[0] || "User";

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    setLoadingTx(true);
    const { data } = await supabase
      .from("token_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setTransactions(Array.isArray(data) ? data : []);
    setLoadingTx(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return; // wait for auth to resolve
    if (!user) { navigate("/login"); return; }
    loadTransactions();
    refreshTokenBalance();
  }, [authLoading, user, navigate, loadTransactions, refreshTokenBalance]);

  const handlePurchase = async (pkg: TokenPackage) => {
    if (!user) { navigate("/login"); return; }
    if (!razorpayReady) {
      toast.error("Payment gateway loading, please try again");
      return;
    }

    setProcessing(pkg.amountPaise);
    try {
      // Step 1: Create Razorpay order via Edge Function
      const { data, error } = await supabase.functions.invoke("razorpay-create-order", {
        body: { amountPaise: pkg.amountPaise },
      });

      if (error || !data?.orderId) {
        const msg = error ? await error?.context?.text?.() : "Failed to create order";
        throw new Error(msg || "Order creation failed");
      }

      // Step 2: Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: pkg.amountPaise,
        currency: "INR",
        name: "SiteGenie",
        description: `${pkg.tokens} SiteGenie Tokens`,
        order_id: data.orderId,
        prefill: {
          name: displayName,
          email: user.email || undefined,
        },
        theme: { color: "#7C3AED" },
        handler: async (response: RazorpayResponse) => {
          // Step 3: Verify payment via Edge Function
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              "razorpay-verify-payment",
              { body: response }
            );

            if (verifyError || !verifyData?.success) {
              const msg = verifyError ? await verifyError?.context?.text?.() : "Verification failed";
              throw new Error(msg);
            }

            toast.success(`${pkg.tokens} tokens added to your account!`, {
              description: `New balance: ${verifyData.newBalance} tokens`,
            });
            await refreshTokenBalance();
            loadTransactions();
          } catch (e) {
            toast.error("Payment verification failed", {
              description: e instanceof Error ? e.message : "Please contact support",
            });
          } finally {
            setProcessing(null);
          }
        },
        modal: {
          ondismiss: () => setProcessing(null),
        },
      });

      rzp.open();
    } catch (e) {
      toast.error("Payment failed", {
        description: e instanceof Error ? e.message : "Please try again",
      });
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          >
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold gradient-text hidden md:inline">SiteGenie</span>
          </button>

          <div className="flex-1" />

          {/* Current balance */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Coins className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">{tokenBalance.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">tokens</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs border border-border/60 text-foreground hover:bg-accent"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Page header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Coins className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-balance">
            Buy <span className="gradient-text">SiteGenie Tokens</span>
          </h1>
          <p className="text-muted-foreground text-pretty max-w-md mx-auto">
            Tokens are used for AI-powered code generation. Each generation costs tokens based on complexity.
          </p>

          {/* Current balance highlight */}
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Current Balance:</span>
            <span className="text-sm font-bold text-primary">{tokenBalance.toLocaleString()} tokens</span>
          </div>
        </div>

        {/* Package grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {PACKAGES.map((pkg) => {
            const Icon = pkg.icon;
            const isProcessing = processing === pkg.amountPaise;
            const pricePerToken = (pkg.amountPaise / 100 / pkg.tokens).toFixed(2);

            return (
              <div
                key={pkg.amountPaise}
                className={cn(
                  "relative rounded-2xl p-5 border flex flex-col h-full transition-all duration-200 hover:-translate-y-0.5",
                  pkg.popular
                    ? "border-primary/60 bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border/60 bg-card hover:border-primary/30"
                )}
                style={{ boxShadow: pkg.popular ? "var(--shadow-hover)" : "var(--shadow-card)" }}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-2.5 py-0.5 whitespace-nowrap">
                    Most Popular
                  </Badge>
                )}
                {pkg.savings && (
                  <Badge variant="secondary" className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] px-2.5 py-0.5 whitespace-nowrap">
                    {pkg.savings}
                  </Badge>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center",
                    pkg.popular ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold">{pkg.label}</span>
                </div>

                <div className="mb-4">
                  <div className="text-3xl font-bold text-foreground">{pkg.amountDisplay}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Coins className="w-3.5 h-3.5 text-primary" />
                    <span className="text-base font-semibold text-primary">{pkg.tokens.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">tokens</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ₹{pricePerToken} / token
                  </p>
                </div>

                <div className="space-y-1.5 mb-5 flex-1">
                  {[
                    `${Math.floor(pkg.tokens / 100)} generations (avg)`,
                    "All 5 AI models",
                    "No expiry",
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                      {feat}
                    </div>
                  ))}
                </div>

                <Button
                  className={cn(
                    "w-full h-9 font-semibold text-sm mt-auto",
                    pkg.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                  onClick={() => handlePurchase(pkg)}
                  disabled={processing !== null}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isProcessing ? "Processing..." : `Buy ${pkg.tokens.toLocaleString()} Tokens`}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Payment info */}
        <div className="glass rounded-xl p-4 flex items-center gap-3 mb-10 border border-border/40">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">Secure payments via Razorpay</p>
            <p className="text-xs text-muted-foreground text-pretty">
              Supports UPI, Net Banking, Credit/Debit Cards, and Wallets. Tokens are credited instantly after payment.
            </p>
          </div>
        </div>

        {/* Transaction history */}
        <div>
          <h2 className="text-base font-semibold mb-4">Purchase History</h2>
          {loadingTx ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
              <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                    tx.amount > 0 ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
                  )}>
                    {tx.amount > 0 ? "+" : "−"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "text-sm font-semibold",
                      tx.amount > 0 ? "text-primary" : "text-destructive"
                    )}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Balance: {tx.balance_after.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
