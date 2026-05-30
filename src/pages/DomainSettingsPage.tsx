import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/db/supabase";
import { isPaidUser, type DomainDeployment } from "@/types/types";
import { AppShell } from "@/components/layouts/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Globe,
  Crown,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Trash2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Loader2,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateTxtToken(userId: string): string {
  const suffix = userId.slice(0, 8).replace(/-/g, "");
  return `sitegenie-verify-${suffix}-${Math.random().toString(36).slice(2, 10)}`;
}

function isValidDomain(domain: string): boolean {
  const pattern = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return pattern.test(domain.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""));
}

function sanitizeDomain(raw: string): string {
  return raw.trim().replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
}

function copyText(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
}

// ── Registrar guides ─────────────────────────────────────────────────────────

type Registrar = "namecheap" | "godaddy" | "hostinger" | "cloudflare" | "other";

const REGISTRARS: { id: Registrar; label: string; color: string }[] = [
  { id: "namecheap",  label: "Namecheap",  color: "text-orange-500" },
  { id: "godaddy",    label: "GoDaddy",    color: "text-chart-3" },
  { id: "hostinger",  label: "Hostinger",  color: "text-purple-500" },
  { id: "cloudflare", label: "Cloudflare", color: "text-chart-1" },
  { id: "other",      label: "Other",      color: "text-muted-foreground" },
];

const REGISTRAR_STEPS: Record<Registrar, string[]> = {
  namecheap: [
    "Log in at namecheap.com → click Domain List in the left sidebar",
    "Find your domain → click Manage",
    "Click the Advanced DNS tab at the top",
    "Under Host Records, click Add New Record",
    "For TXT: Type = TXT Record, Host = @, Value = paste the token below, TTL = Automatic",
    "For CNAME: Type = CNAME Record, Host = www, Value = cname.vercel-dns.com, TTL = Automatic",
    "For A record: Type = A Record, Host = @, Value = 76.76.21.21, TTL = Automatic",
    "Click the ✓ (checkmark) to save each record",
    "Wait 5–30 minutes then click Verify below",
  ],
  godaddy: [
    "Log in at godaddy.com → click your account icon → My Products",
    "Find your domain → click DNS or Manage DNS",
    "Click Add New Record (or the + button)",
    "For TXT: Type = TXT, Name = @, Value = paste the token below, TTL = 1 hour",
    "For CNAME: Type = CNAME, Name = www, Value = cname.vercel-dns.com, TTL = 1 hour",
    "For A record: Type = A, Name = @, Value = 76.76.21.21, TTL = 1 hour",
    "Click Save for each record",
    "GoDaddy changes can take 5–60 min. Click Verify when done",
  ],
  hostinger: [
    "Log in at hostinger.com → click Domains in the top menu",
    "Select your domain → click DNS / Nameservers",
    "Click Manage DNS Records",
    "For TXT: Type = TXT, Name = @ (blank), Content = paste the token below, TTL = 14400",
    "For CNAME: Type = CNAME, Name = www, Points to = cname.vercel-dns.com, TTL = 14400",
    "For A record: Type = A, Name = @ (blank), Points to = 76.76.21.21, TTL = 14400",
    "Click Add Record for each one",
    "Hostinger propagates in 5–15 min. Click Verify below when ready",
  ],
  cloudflare: [
    "Log in at dash.cloudflare.com → click your domain",
    "Go to DNS → Records",
    "Click Add Record",
    "For TXT: Type = TXT, Name = @, Content = paste the token below, TTL = Auto",
    "For CNAME: Type = CNAME, Name = www, Target = cname.vercel-dns.com, Proxy = DNS only (grey cloud)",
    "For A record: Type = A, Name = @, IPv4 = 76.76.21.21, Proxy = DNS only (grey cloud)",
    "⚠️ Important: Set both CNAME and A records to 'DNS only' (NOT proxied) for Vercel SSL to work",
    "Cloudflare is near-instant. Click Verify below",
  ],
  other: [
    "Log in to your domain registrar's control panel",
    "Find the DNS Management or DNS Records section",
    "Add a TXT record: Host = @, Value = paste the token below",
    "Add a CNAME record: Host = www, Value = cname.vercel-dns.com",
    "Add an A record: Host = @, Value = 76.76.21.21",
    "Save all records",
    "Wait up to 48h for propagation, then click Verify below",
  ],
};

// ── DNS record types for display ─────────────────────────────────────────────

interface DnsCheckResult {
  verified: boolean;
  records: string[];
  expected: string;
  message: string;
  error?: string;
}

interface FullDnsResult {
  domain: string;
  allVerified: boolean;
  txt?: DnsCheckResult;
  cname?: DnsCheckResult;
  a?: DnsCheckResult;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UpgradeGate() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
        <Crown className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-3 text-balance">Custom Domains — Pro & Team Only</h2>
      <p className="text-muted-foreground max-w-md mb-8 text-pretty">
        Connect your own domain (e.g.&nbsp;<span className="font-mono text-sm text-foreground">myapp.com</span>) to any
        project you deploy. Upgrade your plan to unlock this feature.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md w-full mb-8">
        {[
          { plan: "Pro", price: "$12/mo", features: ["1 custom domain", "Auto SSL (Let's Encrypt)", "Vercel edge network", "Real-time DNS tracking"] },
          { plan: "Team", price: "$29/mo", features: ["Unlimited domains", "Auto SSL (Let's Encrypt)", "Vercel edge network", "Real-time DNS tracking", "Team sharing"] },
        ].map(({ plan, price, features }) => (
          <div key={plan} className="glass rounded-2xl p-5 border border-border/60 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-lg text-foreground">{plan}</span>
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">{price}</Badge>
            </div>
            <ul className="space-y-1.5">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-chart-3 shrink-0" />{f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        onClick={() => navigate("/subscription")}>
        <Crown className="w-4 h-4 mr-2" /> Upgrade to Pro <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

function RecordRow({ type, name, value, color }: { type: string; name: string; value: string; color: string }) {
  return (
    <tr className="border-t border-border/30">
      <td className={`px-3 py-2.5 font-mono text-xs font-bold ${color}`}>{type}</td>
      <td className="px-3 py-2.5 font-mono text-xs text-foreground">{name}</td>
      <td className="px-3 py-2.5 font-mono text-xs text-foreground/80 break-all">{value}</td>
      <td className="px-3 py-2.5 w-8">
        <button type="button" onClick={() => copyText(value, `${type} value`)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors">
          <Copy className="w-3 h-3 text-muted-foreground" />
        </button>
      </td>
    </tr>
  );
}

function DnsStatusRow({ label, result }: { label: string; result?: DnsCheckResult }) {
  if (!result) return null;
  return (
    <div className={cn(
      "flex items-start gap-2.5 p-3 rounded-xl border text-xs",
      result.verified
        ? "bg-chart-3/5 border-chart-3/30"
        : "bg-warning/5 border-warning/30"
    )}>
      {result.verified
        ? <CheckCircle2 className="w-3.5 h-3.5 text-chart-3 shrink-0 mt-0.5" />
        : <Clock className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-muted-foreground mt-0.5">{result.message}</p>
        {result.records.length > 0 && (
          <p className="font-mono text-[10px] text-muted-foreground mt-1 break-all">
            Found: {result.records.slice(0, 2).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DomainSettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [domainInput, setDomainInput]       = useState("");
  const [connecting, setConnecting]         = useState(false);
  const [removing, setRemoving]             = useState(false);
  const [verifying, setVerifying]           = useState(false);
  const [dnsResult, setDnsResult]           = useState<FullDnsResult | null>(null);
  const [registrar, setRegistrar]           = useState<Registrar>("namecheap");
  const [deployments, setDeployments]       = useState<DomainDeployment[]>([]);
  const [loadingDeploy, setLoadingDeploy]   = useState(true);
  const [autoPolling, setAutoPolling]       = useState(false);
  const [pollCount, setPollCount]           = useState(0);
  const [guideOpen, setGuideOpen]           = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const paid = isPaidUser(profile);

  // Load deployments history
  const loadDeployments = useCallback(async () => {
    if (!user) return;
    setLoadingDeploy(true);
    const { data } = await supabase
      .from("domain_deployments").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    setDeployments((data as DomainDeployment[]) ?? []);
    setLoadingDeploy(false);
  }, [user]);

  useEffect(() => { loadDeployments(); }, [loadDeployments]);

  // ── Real DNS verification via Edge Function ───────────────────────────────
  const runDnsCheck = useCallback(async (domain: string, token: string): Promise<FullDnsResult | null> => {
    try {
      const params = new URLSearchParams({ domain, token, check: "all" });
      const { data, error } = await supabase.functions.invoke(
        `verify-dns?${params.toString()}`, { method: "GET" }
      );
      if (error) {
        const msg = await error?.context?.text?.() ?? error?.message ?? "DNS check failed";
        throw new Error(msg);
      }
      return data as FullDnsResult;
    } catch (err) {
      toast.error("DNS check failed", { description: err instanceof Error ? err.message : "Unknown error" });
      return null;
    }
  }, []);

  // Handle verify button click
  const handleVerify = async () => {
    if (!user || !profile?.custom_domain || !profile?.domain_txt_token) return;
    setVerifying(true);
    setPollCount((c) => c + 1);

    const result = await runDnsCheck(profile.custom_domain, profile.domain_txt_token);
    setDnsResult(result);

    if (result?.allVerified) {
      // Save verified status to DB
      await supabase.from("profiles").update({ domain_verified: true }).eq("id", user.id);
      await supabase.from("domain_deployments").upsert({
        user_id: user.id,
        custom_domain: profile.custom_domain,
        status: "active",
      }, { onConflict: "user_id,custom_domain" });
      await Promise.all([refreshProfile(), loadDeployments()]);
      stopPolling();
      toast.success("🎉 Domain verified and active!", { description: profile.custom_domain });
    } else {
      toast.info("DNS not propagated yet — will auto-check every 30s", { duration: 4000 });
      startPolling();
    }
    setVerifying(false);
  };

  // Auto-polling
  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    setAutoPolling(true);
    pollRef.current = setInterval(async () => {
      if (!profile?.custom_domain || !profile?.domain_txt_token) return;
      const result = await runDnsCheck(profile.custom_domain, profile.domain_txt_token);
      if (result) {
        setDnsResult(result);
        setPollCount((c) => c + 1);
        if (result.allVerified) {
          await supabase.from("profiles").update({ domain_verified: true }).eq("id", user?.id);
          await supabase.from("domain_deployments").upsert({
            user_id: user?.id,
            custom_domain: profile.custom_domain,
            status: "active",
          }, { onConflict: "user_id,custom_domain" });
          await Promise.all([refreshProfile(), loadDeployments()]);
          stopPolling();
          toast.success("🎉 Domain verified!", { description: profile.custom_domain });
        }
      }
    }, 30000);
  }, [profile, user, runDnsCheck, refreshProfile, loadDeployments]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setAutoPolling(false);
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Connect domain ────────────────────────────────────────────────────────
  const handleConnect = async () => {
    if (!user || !profile) return;
    const domain = sanitizeDomain(domainInput);
    if (!domain) { toast.error("Please enter a domain name"); return; }
    if (!isValidDomain(domain)) { toast.error("Invalid domain — e.g. myapp.com"); return; }
    if (profile.custom_domain === domain) { toast.error("This domain is already connected"); return; }

    setConnecting(true);
    const token = generateTxtToken(user.id);
    const { error } = await supabase.from("profiles").update({
      custom_domain: domain, domain_verified: false,
      domain_txt_token: token, domain_added_at: new Date().toISOString(),
    }).eq("id", user.id);

    if (error) {
      toast.error("Failed to save domain", { description: error.message });
    } else {
      await refreshProfile();
      setDomainInput("");
      setDnsResult(null);
      stopPolling();
      toast.success("Domain saved!", { description: "Add the DNS records below then click Verify" });
    }
    setConnecting(false);
  };

  // ── Remove domain ─────────────────────────────────────────────────────────
  const handleRemove = async () => {
    if (!user) return;
    setRemoving(true);
    stopPolling();
    setDnsResult(null);
    await supabase.from("domain_deployments").delete().eq("user_id", user.id);
    const { error } = await supabase.from("profiles").update({
      custom_domain: null, domain_verified: false,
      domain_txt_token: null, domain_added_at: null,
    }).eq("id", user.id);
    if (error) { toast.error("Failed to remove domain"); }
    else { await Promise.all([refreshProfile(), loadDeployments()]); toast.success("Domain removed"); }
    setRemoving(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground">Custom Domain</h1>
              <p className="text-sm text-muted-foreground">Connect your domain with real DNS verification</p>
            </div>
            {paid && (
              <Badge className="ml-auto shrink-0 bg-primary/10 text-primary border-primary/20 border">
                <Crown className="w-3 h-3 mr-1" />
                {profile?.subscription_plan === "team" ? "Team" : "Pro"}
              </Badge>
            )}
          </div>

          {!paid ? <UpgradeGate /> : (
            <div className="space-y-5">

              {/* ── CONNECTED STATE ── */}
              {profile?.custom_domain ? (
                <>
                  {/* Domain status card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        Connected Domain
                        {autoPolling && (
                          <Badge variant="outline" className="ml-auto text-info border-info/30 bg-info/5 text-[10px]">
                            <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" /> Auto-checking
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Domain pill */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0 flex items-center gap-3 glass rounded-xl px-4 py-3 border border-border/60">
                          <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="font-mono text-sm text-foreground truncate">{profile.custom_domain}</span>
                          {profile.domain_verified && (
                            <a href={`https://${profile.custom_domain}`} target="_blank" rel="noreferrer"
                              className="ml-auto shrink-0 text-muted-foreground hover:text-primary transition-colors">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        {profile.domain_verified ? (
                          <Badge className="shrink-0 bg-chart-3/10 text-chart-3 border-chart-3/30 border">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="shrink-0 text-warning border-warning/30 bg-warning/10">
                            <Clock className="w-3 h-3 mr-1" /> Pending
                          </Badge>
                        )}
                      </div>

                      {/* Verified success */}
                      {profile.domain_verified && (
                        <Alert className="border-chart-3/30 bg-chart-3/5">
                          <CheckCircle2 className="w-4 h-4 text-chart-3" />
                          <AlertDescription className="text-sm text-chart-3">
                            Domain verified ✅ SSL auto-provisioned via Let's Encrypt. Your site is live at{" "}
                            <a href={`https://${profile.custom_domain}`} target="_blank" rel="noreferrer"
                              className="underline font-medium">https://{profile.custom_domain}</a>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Not yet verified — show DNS setup */}
                      {!profile.domain_verified && (
                        <>
                          {/* Registrar selector */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Select Your Domain Registrar
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {REGISTRARS.map((r) => (
                                <button key={r.id} type="button"
                                  onClick={() => setRegistrar(r.id)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                                    registrar === r.id
                                      ? "bg-primary/10 border-primary/40 text-primary"
                                      : "bg-muted/50 border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                                  )}>
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* DNS Records to add */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              DNS Records to Add
                            </p>
                            <div className="rounded-xl border border-border/60 bg-background/60 overflow-x-auto">
                              <table className="w-full text-xs min-w-[440px]">
                                <thead>
                                  <tr className="border-b border-border/40">
                                    <th className="text-left px-3 py-2 text-muted-foreground font-medium w-16">Type</th>
                                    <th className="text-left px-3 py-2 text-muted-foreground font-medium w-16">Name</th>
                                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Value</th>
                                    <th className="px-3 py-2 w-8" />
                                  </tr>
                                </thead>
                                <tbody>
                                  <RecordRow type="TXT"   color="text-info"    name="@" value={profile.domain_txt_token ?? ""} />
                                  <RecordRow type="CNAME" color="text-chart-3" name="www" value="cname.vercel-dns.com" />
                                  <RecordRow type="A"     color="text-chart-4" name="@" value="76.76.21.21" />
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Step-by-step guide for selected registrar */}
                          <div className="rounded-xl border border-border/40 overflow-hidden">
                            <button type="button"
                              onClick={() => setGuideOpen((o) => !o)}
                              className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors">
                              <span className="text-xs font-semibold text-foreground">
                                Step-by-step: {REGISTRARS.find((r) => r.id === registrar)?.label} Setup
                              </span>
                              {guideOpen
                                ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                            </button>
                            {guideOpen && (
                              <ol className="px-4 py-3 space-y-2">
                                {REGISTRAR_STEPS[registrar].map((step, i) => (
                                  <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                      {i + 1}
                                    </span>
                                    <span className={step.startsWith("⚠️") ? "text-warning font-medium" : ""}>{step}</span>
                                  </li>
                                ))}
                              </ol>
                            )}
                          </div>

                          {/* DNS check results */}
                          {dnsResult && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                DNS Check Results
                                {pollCount > 0 && (
                                  <span className="ml-2 normal-case font-normal">
                                    (checked {pollCount} time{pollCount !== 1 ? "s" : ""})
                                  </span>
                                )}
                              </p>
                              <DnsStatusRow label="TXT Ownership Record"  result={dnsResult.txt} />
                              <DnsStatusRow label="CNAME (www) Record"    result={dnsResult.cname} />
                              <DnsStatusRow label="A Record (root)"       result={dnsResult.a} />
                            </div>
                          )}

                          {/* Verify button + auto-poll status */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button onClick={handleVerify} disabled={verifying}
                              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                              {verifying
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking DNS…</>
                                : <><Wifi className="w-4 h-4 mr-2" /> Verify Domain Now</>}
                            </Button>
                            {autoPolling && (
                              <Button variant="ghost" onClick={stopPolling}
                                className="border border-border/60 text-muted-foreground hover:text-foreground">
                                <WifiOff className="w-4 h-4 mr-2" /> Stop Auto-Check
                              </Button>
                            )}
                          </div>

                          <p className="text-[11px] text-muted-foreground">
                            After adding records, click Verify. SiteGenie checks real DNS via Cloudflare &amp; Google DNS.
                            If not propagated yet, auto-check runs every 30 seconds.
                          </p>
                        </>
                      )}

                      {/* Remove button */}
                      <Button variant="ghost" size="sm" onClick={handleRemove} disabled={removing}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 border border-destructive/20 w-full sm:w-auto">
                        {removing
                          ? <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" /> Removing…</>
                          : <><Trash2 className="w-3.5 h-3.5 mr-2" /> Remove Domain</>}
                      </Button>
                    </CardContent>
                  </Card>
                </>
              ) : (
                /* ── CONNECT NEW DOMAIN ── */
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" /> Connect a Custom Domain
                    </CardTitle>
                    <CardDescription>Enter your domain — no https:// needed.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 min-w-0">
                        <Input placeholder="myapp.com or app.myapp.com" value={domainInput}
                          onChange={(e) => setDomainInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                          className="font-mono" />
                      </div>
                      <Button onClick={handleConnect} disabled={connecting || !domainInput.trim()}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                        {connecting
                          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                          : <>Connect <ArrowRight className="w-4 h-4 ml-2" /></>}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      You'll receive DNS records to add at your registrar (Namecheap, GoDaddy, Hostinger, Cloudflare…).
                      SiteGenie verifies ownership via real DNS lookup.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* ── DEPLOYMENT HISTORY ── */}
              {!loadingDeploy && deployments.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Domain History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[380px]">
                        <thead>
                          <tr className="border-b border-border/40 text-left">
                            <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs whitespace-nowrap">Domain</th>
                            <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs whitespace-nowrap">Status</th>
                            <th className="pb-2 font-medium text-muted-foreground text-xs whitespace-nowrap">Added</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {deployments.map((d) => (
                            <tr key={d.id}>
                              <td className="py-3 pr-4 font-mono text-xs text-foreground whitespace-nowrap">{d.custom_domain}</td>
                              <td className="py-3 pr-4">
                                <span className={cn(
                                  "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border",
                                  d.status === "active"  ? "bg-chart-3/10 text-chart-3 border-chart-3/30"
                                  : d.status === "error" ? "bg-destructive/10 text-destructive border-destructive/30"
                                  :                        "bg-warning/10 text-warning border-warning/30"
                                )}>
                                  {d.status === "active"  && <CheckCircle2 className="w-3 h-3" />}
                                  {d.status === "error"   && <XCircle className="w-3 h-3" />}
                                  {d.status === "pending" && <Clock className="w-3 h-3" />}
                                  {d.status}
                                </span>
                              </td>
                              <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(d.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── HOW IT WORKS ── */}
              <Card className="bg-secondary/40 border-border/40">
                <CardContent className="pt-5">
                  <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> How Domain Verification Works
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Enter your domain → receive TXT + CNAME + A records",
                      "Add the records at your registrar (Namecheap, GoDaddy, Hostinger, Cloudflare…)",
                      "Click Verify — SiteGenie queries real DNS via Cloudflare & Google DNS servers",
                      "Auto-polling checks every 30s if DNS hasn't propagated yet",
                      "Once verified, SSL certificate is auto-provisioned via Let's Encrypt",
                    ].map((step, i) => (
                      <li key={step} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

