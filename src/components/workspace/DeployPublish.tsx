import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Github,
  Download,
  Rocket,
  Check,
  Loader2,
  ExternalLink,
  Copy,
  AlertCircle,
  Lock,
  Coins,
  Share2,
  RefreshCw,
  EyeOff,
  ChevronRight,
  Sparkles,
  Info,
  Eye,
  EyeOff as EyeOffIcon,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { Framework, VirtualFileSystem } from "@/types/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/db/supabase";

interface DeployPublishProps {
  open: boolean;
  onClose: () => void;
  files: VirtualFileSystem;
  projectName: string;
  isPaidUser?: boolean;
  projectId?: string | null;
  framework?: Framework;
}

type Tab = "publish" | "export";

export function DeployPublish({
  open,
  onClose,
  files,
  projectName,
  isPaidUser = false,
  projectId,
  framework = "react-ts",
}: DeployPublishProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("publish");

  // Platform publish state
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(true);
  const [version, setVersion] = useState(1);
  const [liveUrl, setLiveUrl] = useState("");

  // Export sub-tab
  const [exportTab, setExportTab] = useState<"vercel" | "github" | "zip">("vercel");

  // Vercel state
  const [vercelToken, setVercelToken] = useState("");
  const [vercelProject, setVercelProject] = useState(projectName);
  const [vercelDeploying, setVercelDeploying] = useState(false);
  const [vercelUrl, setVercelUrl] = useState("");
  const [vercelError, setVercelError] = useState("");
  const [showVercelToken, setShowVercelToken] = useState(false);

  // Multi-domain state
  const [domainInputs, setDomainInputs] = useState<string[]>([""]);
  const [deployedProjectId, setDeployedProjectId] = useState<string>("");
  interface DomainStatus {
    assigned: boolean;
    domain: string;
    cnameTarget: string;
    aRecord: string;
    error?: string;
    alreadyExists?: boolean;
    verifyStatus?: "idle" | "checking" | "verified" | "failed";
    verifyMessage?: string;
    challenges?: { type: string; domain: string; value: string }[];
  }
  const [domainStatuses, setDomainStatuses] = useState<DomainStatus[]>([]);

  // GitHub state
  const [githubToken, setGithubToken] = useState("");
  const [githubRepo, setGithubRepo] = useState(projectName);
  const [githubUsername, setGithubUsername] = useState("");
  const [githubExporting, setGithubExporting] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [githubError, setGithubError] = useState("");
  const [githubPushed, setGithubPushed] = useState(0);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [githubPrivate, setGithubPrivate] = useState(false);

  const fileCount = Object.keys(files).length;
  const liveUrl = `https://app-${projectId ?? "preview"}.sitegeniebuild.com`;

  // ── Platform publish (Miaoda hosting) ──
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const slug = projectName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 40) + "-" + Math.random().toString(36).slice(2, 7);
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("published_sites").upsert({
        slug,
        user_id: user?.id,
        project_id: projectId || null,
        files,
        framework,
        project_name: projectName,
        updated_at: new Date().toISOString(),
      }, { onConflict: "slug" });
      if (error) throw error;
      const url = `https://${slug}.sitegeniebuild.com`;
      setLiveUrl(url);
      setVersion((v) => v + 1);
      setIsPublished(true);
      setHasUnpublishedChanges(false);
      setIsPublishing(false);
      toast.success("Published successfully!", { description: url });
    } catch (err) {
      setIsPublishing(false);
      toast.error("Publish failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleUnpublish = () => {
    setIsPublished(false);
    setHasUnpublishedChanges(true);
    toast.info("App unpublished");
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(liveUrl);
    toast.success("Link copied!");
  };

  // ── Real Vercel deploy via Edge Function ──
  const handleVercelDeploy = async () => {
    if (!vercelToken.trim()) { toast.error("Vercel token is required"); return; }
    if (!vercelProject.trim()) { toast.error("Project name is required"); return; }

    setVercelDeploying(true);
    setVercelError("");
    setVercelUrl("");
    setDomainStatuses([]);

    const cleanDomains = domainInputs.map((d) => d.trim()).filter(Boolean);

    try {
      const { data, error } = await supabase.functions.invoke("deploy-vercel", {
        body: {
          token: vercelToken.trim(),
          projectName: vercelProject.trim(),
          files,
          customDomains: cleanDomains.length > 0 ? cleanDomains : undefined,
        },
      });

      if (error) {
        const msg = await error?.context?.text?.() || error?.message || "Deployment failed";
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);

      setVercelUrl(data.url);
      if (data.projectId) setDeployedProjectId(data.projectId);
      if (Array.isArray(data.domains) && data.domains.length > 0) {
        setDomainStatuses(
          data.domains.map((d: DomainStatus) => ({ ...d, verifyStatus: "idle" as const }))
        );
      }
      toast.success("Deployed to Vercel!", { description: data.url });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Deployment failed";
      setVercelError(msg);
      toast.error("Vercel deployment failed", { description: msg });
    } finally {
      setVercelDeploying(false);
    }
  };

  // ── Check DNS status for a single domain ──
  const handleCheckDns = async (domain: string, idx: number) => {
    if (!deployedProjectId || !vercelToken.trim()) {
      toast.error("Deploy your project first before checking DNS.");
      return;
    }
    setDomainStatuses((prev) =>
      prev.map((s, i) => i === idx ? { ...s, verifyStatus: "checking" } : s)
    );
    try {
      const params = new URLSearchParams({
        token: vercelToken.trim(),
        projectId: deployedProjectId,
        domain,
      });
      const { data, error } = await supabase.functions.invoke(
        `verify-domain?${params.toString()}`,
        { method: "GET" }
      );
      if (error) {
        const msg = await error?.context?.text?.() || error?.message || "Verification failed";
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      setDomainStatuses((prev) =>
        prev.map((s, i) =>
          i === idx
            ? {
                ...s,
                verifyStatus: data.verified ? "verified" : "failed",
                verifyMessage: data.message,
                challenges: data.challenges ?? [],
              }
            : s
        )
      );
      if (data.verified) toast.success(`${domain} is live!`);
      else toast.info("DNS not propagated yet — try again soon.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setDomainStatuses((prev) =>
        prev.map((s, i) =>
          i === idx ? { ...s, verifyStatus: "failed", verifyMessage: msg } : s
        )
      );
      toast.error("DNS check failed", { description: msg });
    }
  };

  // ── Real GitHub export via Edge Function ──
  const handleGitHubExport = async () => {
    if (!githubToken.trim()) { toast.error("GitHub token is required"); return; }
    if (!githubUsername.trim()) { toast.error("GitHub username is required"); return; }
    if (!githubRepo.trim()) { toast.error("Repository name is required"); return; }

    setGithubExporting(true);
    setGithubError("");
    setGithubUrl("");
    setGithubPushed(0);

    try {
      const { data, error } = await supabase.functions.invoke("deploy-github", {
        body: {
          token: githubToken.trim(),
          username: githubUsername.trim(),
          repoName: githubRepo.trim(),
          files,
          isPrivate: githubPrivate,
        },
      });

      if (error) {
        const msg = await error?.context?.text?.() || error?.message || "Export failed";
        throw new Error(msg);
      }

      if (data?.error) throw new Error(data.error);

      setGithubUrl(data.url);
      setGithubPushed(data.pushed ?? 0);
      const warnings = data.errors?.length
        ? ` (${data.errors.length} file${data.errors.length > 1 ? "s" : ""} had errors)`
        : "";
      toast.success(`Exported ${data.pushed} files to GitHub!${warnings}`, { description: data.url });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed";
      setGithubError(msg);
      toast.error("GitHub export failed", { description: msg });
    } finally {
      setGithubExporting(false);
    }
  };

  // ── ZIP Download — framework-aware, no files lost ──
  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const slug = projectName.toLowerCase().replace(/\s+/g, "-");

    // Add ALL generated project files first (no modifications)
    for (const [filePath, fileContent] of Object.entries(files)) {
      const p = filePath.startsWith("/") ? filePath.slice(1) : filePath;
      zip.file(p, fileContent);
    }

    const has = (f: string) =>
      !!files[`/${f}`] || !!files[f];

    // Per-framework scaffold — only add missing boilerplate files
    if (framework === "react-ts" || framework === "react-js") {
      const isTs = framework === "react-ts";
      if (!has("package.json")) {
        zip.file("package.json", JSON.stringify({
          name: slug, version: "1.0.0", private: true,
          dependencies: {
            react: "^18.0.0", "react-dom": "^18.0.0",
            ...(isTs ? { typescript: "^5.0.0", "@types/react": "^18.0.0", "@types/react-dom": "^18.0.0" } : {}),
          },
          devDependencies: { vite: "^5.0.0", "@vitejs/plugin-react": "^4.0.0" },
          scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
        }, null, 2));
      }
      if (!has("vite.config" + (isTs ? ".ts" : ".js"))) {
        zip.file(`vite.config.${isTs ? "ts" : "js"}`,
          `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });`
        );
      }
      if (!has("index.html")) {
        zip.file("index.html",
          `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${projectName}</title></head><body><div id="root"></div><script type="module" src="/src/main.${isTs ? "tsx" : "jsx"}"></script></body></html>`
        );
      }
      if (!has(`src/main.${isTs ? "tsx" : "jsx"}`) && !has("main.tsx") && !has("main.jsx")) {
        zip.file(`src/main.${isTs ? "tsx" : "jsx"}`,
          `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);`
        );
      }
      if (!has("README.md")) {
        zip.file("README.md",
          `# ${projectName}

Generated with SiteGenie.

## Run locally
\`\`\`bash
npm install
npm run dev
\`\`\`

## Build for production
\`\`\`bash
npm run build
npm run preview
\`\`\`
`
        );
      }

    } else if (framework === "vue") {
      if (!has("package.json")) {
        zip.file("package.json", JSON.stringify({
          name: slug, version: "1.0.0", private: true,
          dependencies: { vue: "^3.0.0" },
          devDependencies: { vite: "^5.0.0", "@vitejs/plugin-vue": "^5.0.0" },
          scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
        }, null, 2));
      }
      if (!has("vite.config.js")) {
        zip.file("vite.config.js",
          `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({ plugins: [vue()] });`
        );
      }
      if (!has("index.html")) {
        zip.file("index.html",
          `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${projectName}</title></head><body><div id="app"></div><script type="module" src="/src/main.js"></script></body></html>`
        );
      }
      if (!has("src/main.js") && !has("main.js")) {
        zip.file("src/main.js",
          `import { createApp } from 'vue';
import App from './App.vue';
createApp(App).mount('#app');`
        );
      }
      if (!has("README.md")) {
        zip.file("README.md",
          `# ${projectName}

Generated with SiteGenie.

## Run locally
\`\`\`bash
npm install
npm run dev
\`\`\`
`
        );
      }

    } else if (framework === "svelte") {
      if (!has("package.json")) {
        zip.file("package.json", JSON.stringify({
          name: slug, version: "1.0.0", private: true,
          devDependencies: { vite: "^5.0.0", "@sveltejs/vite-plugin-svelte": "^3.0.0", svelte: "^4.0.0" },
          scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
        }, null, 2));
      }
      if (!has("vite.config.js")) {
        zip.file("vite.config.js",
          `import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
export default defineConfig({ plugins: [svelte()] });`
        );
      }
      if (!has("index.html")) {
        zip.file("index.html",
          `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${projectName}</title></head><body><script type="module" src="/main.js"></script></body></html>`
        );
      }
      if (!has("main.js")) {
        zip.file("main.js",
          `import App from './App.svelte';
new App({ target: document.body });`
        );
      }
      if (!has("README.md")) {
        zip.file("README.md",
          `# ${projectName}

Generated with SiteGenie.

## Run locally
\`\`\`bash
npm install
npm run dev
\`\`\`
`
        );
      }

    } else if (framework === "vanilla-js") {
      // Vanilla: no build step — open index.html directly in browser
      if (!has("README.md")) {
        zip.file("README.md",
          `# ${projectName}

Generated with SiteGenie.

## Run locally
Just open **index.html** in your browser — no install needed!

For a local server:
\`\`\`bash
npx serve .
\`\`\`
`
        );
      }

    } else if (framework === "python-django") {
      if (!has("requirements.txt")) {
        zip.file("requirements.txt", "Django>=4.2\ngunicorn>=21.0\n");
      }
      if (!has(".env.example")) {
        zip.file(".env.example", "DEBUG=True\nSECRET_KEY=your-secret-key-here\nALLOWED_HOSTS=localhost,127.0.0.1\n");
      }
      if (!has("README.md")) {
        zip.file("README.md",
          `# ${projectName}

Generated with SiteGenie.

## Setup
\`\`\`bash
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
\`\`\`

Visit: http://127.0.0.1:8000
`
        );
      }

    } else if (framework === "php-laravel") {
      if (!has("composer.json")) {
        zip.file("composer.json", JSON.stringify({
          name: `sitegenie/${slug}`,
          require: { php: ">=8.1", "laravel/framework": "^10.0" },
          scripts: { post_autoload_dump: ["Illuminate\\Foundation\\ComposerScripts::postAutoloadDump", "@php artisan package:discover --ansi"] },
          autoload: { "psr-4": { "App\\": "app/" } },
        }, null, 2));
      }
      if (!has(".env.example")) {
        zip.file(".env.example",
          "APP_NAME=" + projectName + "\nAPP_ENV=local\nAPP_KEY=\nAPP_DEBUG=true\nAPP_URL=http://localhost\n\nDB_CONNECTION=sqlite\n"
        );
      }
      if (!has("README.md")) {
        zip.file("README.md",
          `# ${projectName}

Generated with SiteGenie.

## Setup
\`\`\`bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
\`\`\`

Visit: http://127.0.0.1:8000
`
        );
      }
    }

    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    saveAs(blob, `${slug}.zip`);
    toast.success(`Downloaded ${fileCount} files`, {
      description: "All project files preserved — see README.md to run locally.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-base font-semibold">Publish</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-border mt-4 px-1">
          {([
            { id: "publish" as Tab, label: "Publish" },
            { id: "export" as Tab, label: "Export" },
          ]).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4 max-h-[70dvh] overflow-y-auto">

          {/* ── PUBLISH TAB (platform hosting) ── */}
          {activeTab === "publish" && (
            <>
              {/* App preview card */}
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <div className="h-28 bg-gradient-to-br from-primary/10 via-primary/5 to-chart-2/10 flex flex-col items-center justify-center gap-2 border-b border-border relative">
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-hero)" }} />
                  <Badge variant="secondary" className="text-[10px] gap-1 z-10">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI-Powered App Builder — Next Generation
                  </Badge>
                  <h3 className="text-xs font-bold text-center px-6 text-balance z-10">
                    Build Apps with <span className="gradient-text">AI Intelligence</span>
                  </h3>
                </div>
                <div className="divide-y divide-border/50">
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground text-xs truncate max-w-[160px]">{projectName || "AI-Powered Coding IDE"}</span>
                    <Badge variant="outline" className="text-[10px] bg-chart-3/10 text-chart-3 border-chart-3/30 shrink-0">
                      v{version}
                    </Badge>
                  </div>
                  {isPublished && (
                    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground text-xs">Access Link</span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs text-foreground truncate max-w-[120px]">{liveUrl}</span>
                        <button type="button" onClick={() => { navigator.clipboard.writeText(liveUrl); toast.success("Copied!"); }} className="text-muted-foreground hover:text-foreground shrink-0">
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={copyUrl} className="text-muted-foreground hover:text-foreground shrink-0">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {hasUnpublishedChanges && isPublished && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-amber-300/50 bg-amber-50 text-amber-700">
                  <Info className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-medium">Unpublished Changes. Update to publish the latest version.</p>
                </div>
              )}

              <div className="flex gap-2">
                {isPublished ? (
                  <>
                    <Button variant="ghost" className="flex-1 h-10 text-sm border border-border/60 text-foreground hover:bg-accent gap-1.5" onClick={handleUnpublish}>
                      <EyeOff className="w-3.5 h-3.5" />Unpublish
                    </Button>
                    <Button className="flex-1 h-10 text-sm bg-foreground text-background hover:bg-foreground/90 gap-1.5" onClick={handlePublish} disabled={isPublishing}>
                      {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Update&Publish
                    </Button>
                  </>
                ) : (
                  <Button className="w-full h-10 text-sm bg-primary text-primary-foreground hover:bg-primary/90 gap-2" onClick={handlePublish} disabled={isPublishing}>
                    {isPublishing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Publishing…</> : <><Rocket className="w-3.5 h-3.5" />Publish App</>}
                  </Button>
                )}
              </div>

              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border/60 hover:border-border hover:bg-accent/30 transition-colors text-sm"
                onClick={() => toast.info("Custom Domain requires PRO plan")}
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground text-sm">Configure Custom Domain</span>
                  <Badge className="text-[9px] bg-primary/20 text-primary border-primary/30 h-4 px-1.5">PRO</Badge>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </>
          )}

          {/* ── EXPORT TAB (real APIs) ── */}
          {activeTab === "export" && (
            <>
              {/* Sub-tabs */}
              <div className="flex border border-border/60 rounded-lg overflow-hidden">
                {([
                  { id: "vercel", label: "Vercel", icon: Rocket },
                  { id: "github", label: "GitHub", icon: Github },
                  { id: "zip", label: "ZIP", icon: Download },
                ] as { id: "vercel" | "github" | "zip"; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
                      exportTab === id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground bg-transparent"
                    )}
                    onClick={() => setExportTab(id)}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* ── VERCEL ── */}
              {exportTab === "vercel" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border/40">
                    <Rocket className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">Real Vercel deployment</p>
                      <p>Get your token at <a href="https://vercel.com/account/tokens" target="_blank" rel="noreferrer" className="text-primary underline">vercel.com/account/tokens</a></p>
                    </div>
                  </div>

                  {vercelUrl ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
                        <Check className="w-4 h-4 text-green-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-green-700">Deployed to Vercel!</p>
                          <p className="text-[10px] text-green-600 truncate">{vercelUrl}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { navigator.clipboard.writeText(vercelUrl); toast.success("Copied!"); }}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <Button className="w-full gap-2 bg-primary text-primary-foreground" onClick={() => window.open(vercelUrl, "_blank")}>
                        <ExternalLink className="w-3.5 h-3.5" />Open Live Site
                      </Button>

                      {/* ── Multi-domain DNS panels ── */}
                      {domainStatuses.length > 0 && (
                        <div className="space-y-2">
                          {domainStatuses.map((ds, idx) => (
                            <div
                              key={ds.domain}
                              className={`rounded-xl border p-3 space-y-2.5 text-xs ${
                                ds.verifyStatus === "verified"
                                  ? "bg-green-50 border-green-200"
                                  : ds.assigned
                                  ? "bg-blue-50 border-blue-200"
                                  : "bg-amber-50 border-amber-200"
                              }`}
                            >
                              {/* Header row */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {ds.verifyStatus === "verified" ? (
                                  <ShieldCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                ) : ds.verifyStatus === "failed" ? (
                                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                ) : (
                                  <Globe className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                                )}
                                <p className={`font-semibold flex-1 min-w-0 truncate ${
                                  ds.verifyStatus === "verified" ? "text-green-700" : ds.assigned ? "text-blue-700" : "text-amber-700"
                                }`}>
                                  {ds.verifyStatus === "verified"
                                    ? `✅ ${ds.domain} — Live!`
                                    : ds.assigned
                                    ? `🔗 ${ds.domain} — Set DNS below`
                                    : `⚠️ ${ds.domain} — Manual setup required`}
                                </p>
                                {/* Check DNS button */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-[10px] border border-border/60 shrink-0"
                                  disabled={ds.verifyStatus === "checking"}
                                  onClick={() => handleCheckDns(ds.domain, idx)}
                                >
                                  {ds.verifyStatus === "checking" ? (
                                    <><Loader2 className="w-3 h-3 animate-spin mr-1" />Checking…</>
                                  ) : (
                                    <><RefreshCw className="w-3 h-3 mr-1" />Check DNS</>
                                  )}
                                </Button>
                              </div>

                              {/* Verify status message */}
                              {ds.verifyMessage && (
                                <p className={`text-[10px] leading-relaxed ${ds.verifyStatus === "verified" ? "text-green-600" : "text-amber-600"}`}>
                                  {ds.verifyMessage}
                                </p>
                              )}
                              {ds.error && !ds.verifyMessage && (
                                <p className="text-amber-600 text-[10px]">{ds.error}</p>
                              )}

                              {/* DNS records (only show when not yet verified) */}
                              {ds.verifyStatus !== "verified" && (
                                <>
                                  <p className="text-[10px] font-medium text-blue-600">
                                    Add these DNS records at your registrar (GoDaddy, Cloudflare, Namecheap, etc.):
                                  </p>
                                  {/* CNAME */}
                                  <div className="rounded-lg bg-white/70 border border-current/10 p-2 space-y-1.5">
                                    <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">CNAME — www / subdomain</p>
                                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[10px] font-mono">
                                      <span className="text-muted-foreground">Type</span><span className="font-semibold">CNAME</span>
                                      <span className="text-muted-foreground">Host</span>
                                      <div className="flex items-center gap-1 min-w-0">
                                        <span className="font-semibold truncate">{ds.domain.startsWith("www.") ? "www" : ds.domain.split(".")[0]}</span>
                                        <button type="button" className="shrink-0 text-muted-foreground hover:text-foreground" onClick={() => { navigator.clipboard.writeText(ds.domain.startsWith("www.") ? "www" : ds.domain.split(".")[0]); toast.success("Copied!"); }}><Copy className="w-3 h-3" /></button>
                                      </div>
                                      <span className="text-muted-foreground">Value</span>
                                      <div className="flex items-center gap-1 min-w-0">
                                        <span className="font-semibold truncate">{ds.cnameTarget}</span>
                                        <button type="button" className="shrink-0 text-muted-foreground hover:text-foreground" onClick={() => { navigator.clipboard.writeText(ds.cnameTarget); toast.success("Copied!"); }}><Copy className="w-3 h-3" /></button>
                                      </div>
                                      <span className="text-muted-foreground">TTL</span><span>Auto / 3600</span>
                                    </div>
                                  </div>
                                  {/* A record */}
                                  <div className="rounded-lg bg-white/70 border border-current/10 p-2 space-y-1.5">
                                    <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">A Record — root / apex</p>
                                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[10px] font-mono">
                                      <span className="text-muted-foreground">Type</span><span className="font-semibold">A</span>
                                      <span className="text-muted-foreground">Host</span><span className="font-semibold">@ (root)</span>
                                      <span className="text-muted-foreground">Value</span>
                                      <div className="flex items-center gap-1">
                                        <span className="font-semibold">{ds.aRecord}</span>
                                        <button type="button" className="shrink-0 text-muted-foreground hover:text-foreground" onClick={() => { navigator.clipboard.writeText(ds.aRecord); toast.success("Copied!"); }}><Copy className="w-3 h-3" /></button>
                                      </div>
                                      <span className="text-muted-foreground">TTL</span><span>Auto / 3600</span>
                                    </div>
                                  </div>
                                  {/* Verification challenges (TXT records) */}
                                  {ds.challenges && ds.challenges.length > 0 && (
                                    <div className="rounded-lg bg-white/70 border border-current/10 p-2 space-y-1.5">
                                      <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">TXT Verification Record</p>
                                      {ds.challenges.map((c, ci) => (
                                        <div key={ci} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[10px] font-mono">
                                          <span className="text-muted-foreground">Type</span><span className="font-semibold">{c.type}</span>
                                          <span className="text-muted-foreground">Host</span>
                                          <div className="flex items-center gap-1 min-w-0">
                                            <span className="font-semibold truncate">{c.domain}</span>
                                            <button type="button" className="shrink-0 text-muted-foreground hover:text-foreground" onClick={() => { navigator.clipboard.writeText(c.domain); toast.success("Copied!"); }}><Copy className="w-3 h-3" /></button>
                                          </div>
                                          <span className="text-muted-foreground">Value</span>
                                          <div className="flex items-center gap-1 min-w-0">
                                            <span className="font-semibold truncate">{c.value}</span>
                                            <button type="button" className="shrink-0 text-muted-foreground hover:text-foreground" onClick={() => { navigator.clipboard.writeText(c.value); toast.success("Copied!"); }}><Copy className="w-3 h-3" /></button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <p className="text-[10px] text-muted-foreground">DNS propagation can take up to 48h. Click "Check DNS" to refresh status.</p>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <Button variant="ghost" className="w-full text-xs border border-border/60" onClick={() => { setVercelUrl(""); setDomainStatuses([]); setDeployedProjectId(""); }}>
                        Deploy Again
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-normal text-foreground/80">Project Name</label>
                        <input value={vercelProject} onChange={(e) => setVercelProject(e.target.value)} placeholder="my-app" className="w-full h-8 px-3 text-sm rounded-md border border-border/60 bg-muted/50 outline-none focus:border-primary" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-normal text-foreground/80">Vercel Token <span className="text-destructive">*</span></label>
                        <div className="relative">
                          <input
                            type={showVercelToken ? "text" : "password"}
                            value={vercelToken}
                            onChange={(e) => setVercelToken(e.target.value)}
                            placeholder="your-vercel-token"
                            className="w-full h-8 px-3 pr-8 text-sm rounded-md border border-border/60 bg-muted/50 outline-none focus:border-primary"
                          />
                          <button type="button" onClick={() => setShowVercelToken((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showVercelToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      {vercelError && (
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/8 border border-destructive/20">
                          <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                          <p className="text-xs text-destructive break-words">{vercelError}</p>
                        </div>
                      )}
                      {/* Multi-domain input */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-normal text-foreground/80">
                            Custom Domains <span className="text-muted-foreground text-[10px]">(optional)</span>
                          </label>
                          <button
                            type="button"
                            className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80"
                            onClick={() => setDomainInputs((prev) => [...prev, ""])}
                          >
                            <Plus className="w-3 h-3" />Add domain
                          </button>
                        </div>
                        {domainInputs.map((val, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <div className="relative flex-1 min-w-0">
                              <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                              <input
                                value={val}
                                onChange={(e) => {
                                  const next = [...domainInputs];
                                  next[idx] = e.target.value;
                                  setDomainInputs(next);
                                }}
                                placeholder="www.yourdomain.com"
                                className="w-full h-8 pl-7 pr-3 text-sm rounded-md border border-border/60 bg-muted/50 outline-none focus:border-primary"
                              />
                            </div>
                            {domainInputs.length > 1 && (
                              <button
                                type="button"
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => setDomainInputs((prev) => prev.filter((_, i) => i !== idx))}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <p className="text-[10px] text-muted-foreground">Leave blank for auto *.vercel.app URL. Add multiple domains for the same deployment.</p>
                      </div>

                      <Button className="w-full h-9 gap-2 bg-primary text-primary-foreground" onClick={handleVercelDeploy} disabled={vercelDeploying || !vercelToken.trim()}>
                        {vercelDeploying ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Deploying {fileCount} files…</> : <><Rocket className="w-3.5 h-3.5" />Deploy to Vercel</>}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* ── GITHUB ── */}
              {exportTab === "github" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border/40">
                    <Github className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">Real GitHub export</p>
                      <p>Create a token at <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noreferrer" className="text-primary underline">github.com/settings/tokens</a> with <code className="bg-muted px-1 rounded">repo</code> scope</p>
                    </div>
                  </div>

                  {githubUrl ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
                        <Check className="w-4 h-4 text-green-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-green-700">Exported {githubPushed} files to GitHub!</p>
                          <p className="text-[10px] text-green-600 truncate">{githubUrl}</p>
                        </div>
                      </div>
                      <Button className="w-full gap-2 bg-primary text-primary-foreground" onClick={() => window.open(githubUrl, "_blank")}>
                        <ExternalLink className="w-3.5 h-3.5" />Open Repository
                      </Button>
                      <Button variant="ghost" className="w-full text-xs border border-border/60" onClick={() => setGithubUrl("")}>
                        Export Again
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-normal text-foreground/80">GitHub Username <span className="text-destructive">*</span></label>
                          <input value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} placeholder="username" className="w-full h-8 px-3 text-sm rounded-md border border-border/60 bg-muted/50 outline-none focus:border-primary" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-normal text-foreground/80">Repository Name <span className="text-destructive">*</span></label>
                          <input value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} placeholder="my-app" className="w-full h-8 px-3 text-sm rounded-md border border-border/60 bg-muted/50 outline-none focus:border-primary" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-normal text-foreground/80">Personal Access Token <span className="text-destructive">*</span></label>
                        <div className="relative">
                          <input
                            type={showGithubToken ? "text" : "password"}
                            value={githubToken}
                            onChange={(e) => setGithubToken(e.target.value)}
                            placeholder="ghp_xxxxxxxxxxxx"
                            className="w-full h-8 px-3 pr-8 text-sm rounded-md border border-border/60 bg-muted/50 outline-none focus:border-primary"
                          />
                          <button type="button" onClick={() => setShowGithubToken((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showGithubToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={githubPrivate}
                          onChange={(e) => setGithubPrivate(e.target.checked)}
                          className="rounded border-border"
                        />
                        <span className="text-xs text-muted-foreground">Private repository</span>
                      </label>
                      {githubError && (
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/8 border border-destructive/20">
                          <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                          <p className="text-xs text-destructive break-words">{githubError}</p>
                        </div>
                      )}
                      <Button className="w-full h-9 gap-2 bg-primary text-primary-foreground" onClick={handleGitHubExport} disabled={githubExporting || !githubToken.trim() || !githubUsername.trim()}>
                        {githubExporting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Exporting {fileCount} files…</> : <><Github className="w-3.5 h-3.5" />Export to GitHub</>}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* ── ZIP ── */}
              {exportTab === "zip" && (
                <div className="space-y-3">
                  {/* Info banner */}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border/40">
                    <Download className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-foreground">
                        {fileCount} files · Complete project archive
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        All source files preserved. Framework scaffold + README included.
                      </p>
                    </div>
                  </div>

                  {/* Framework-specific run instructions */}
                  <div className="rounded-xl bg-muted/50 border border-border/40 p-3 space-y-1.5">
                    <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">Run after download</p>
                    {(framework === "react-ts" || framework === "react-js") && (
                      <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap">
{"npm install\nnpm run dev"}
                      </pre>
                    )}
                    {framework === "vue" && (
                      <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap">
{"npm install\nnpm run dev"}
                      </pre>
                    )}
                    {framework === "svelte" && (
                      <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap">
{"npm install\nnpm run dev"}
                      </pre>
                    )}
                    {framework === "vanilla-js" && (
                      <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap">
{"# No install needed!\nOpen index.html in your browser\n\n# Or use a local server:\nnpx serve ."}
                      </pre>
                    )}
                    {framework === "python-django" && (
                      <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap">
{"pip install -r requirements.txt\npython manage.py migrate\npython manage.py runserver"}
                      </pre>
                    )}
                    {framework === "php-laravel" && (
                      <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap">
{"composer install\nphp artisan key:generate\nphp artisan migrate\nphp artisan serve"}
                      </pre>
                    )}
                    <p className="text-[10px] text-muted-foreground">See README.md inside the ZIP for full instructions.</p>
                  </div>

                  {!isPaidUser ? (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col items-center gap-3 text-center">
                      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">ZIP Download — Paid Feature</p>
                        <p className="text-xs text-muted-foreground mt-1 text-pretty">Purchase tokens to unlock full file downloads.</p>
                      </div>
                      <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { onClose(); navigate("/subscription"); }}>
                        <Coins className="w-3.5 h-3.5" />Buy Tokens to Unlock
                      </Button>
                    </div>
                  ) : (
                    <Button className="w-full h-9 gap-2 bg-primary text-primary-foreground" onClick={handleDownloadZip} disabled={fileCount === 0}>
                      <Download className="w-3.5 h-3.5" />Download ZIP ({fileCount} files)
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
