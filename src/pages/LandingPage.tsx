import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Zap, Code2, Eye, GitBranch, Layers, MessageSquare,
  ArrowRight, Play, Star, Check, ChevronRight, Terminal,
  Smartphone, ShoppingCart, LayoutDashboard, Lock, Gamepad2,
  Bot, Globe, Server, Database, Upload, Rocket, RefreshCw,
  MonitorPlay, Wand2, BarChart2, Package, Shield, Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Features
const FEATURES = [
  { icon: MessageSquare, title: "Natural Language Coding", description: "Describe your app in plain English. SiteGenie turns your prompt into production-ready code via CrewAI agents and OpenRouter LLM gateway.", gradient: "from-chart-1/20 to-chart-1/5", iconColor: "text-chart-1" },
  { icon: Code2, title: "VS Code-Style Editor", description: "Full Monaco Editor with syntax highlighting, TypeScript IntelliSense, multi-file tabs and auto-completion.", gradient: "from-info/20 to-info/5", iconColor: "text-info" },
  { icon: Eye, title: "Instant Live Preview", description: "Your app runs live inside WebContainer (browser) or E2B sandbox. Every change reflects immediately — interactive, not a screenshot.", gradient: "from-chart-3/20 to-chart-3/5", iconColor: "text-chart-3" },
  { icon: Layers, title: "CrewAI Multi-Agent", description: "Specialized CrewAI agents collaborate — Planner, Coder, Reviewer — orchestrated via OpenRouter to produce high-quality, structured output.", gradient: "from-chart-4/20 to-chart-4/5", iconColor: "text-chart-4" },
  { icon: Rocket, title: "GitHub + Vercel Deploy", description: "Publish to GitHub and deploy to Vercel in one click. Your app gets a live production URL in seconds.", gradient: "from-chart-5/20 to-chart-5/5", iconColor: "text-chart-5" },
  { icon: Zap, title: "Auto Error Fixing", description: "Runtime errors in WebContainer or E2B are captured and automatically fed back to the AI for self-healing code — no manual debugging.", gradient: "from-chart-1/20 to-info/5", iconColor: "text-primary" },
];

// ── Tech stack badges
const TECH_STACK = [
  "Next.js", "React", "TailwindCSS", "TypeScript",
  "CrewAI", "OpenRouter", "WebContainer", "E2B Sandbox",
  "Supabase", "Vercel", "Monaco Editor", "Sandpack",
  "Node.js", "shadcn/ui", "GitHub API",
];

// ── How it works steps
const HOW_IT_WORKS = [
  { step: "01", icon: Terminal, title: "Type Your Prompt", description: "Describe what you want to build in plain English — a SaaS app, a game, an API, a dashboard.", color: "text-chart-1", bg: "bg-chart-1/10 border-chart-1/20" },
  { step: "02", icon: Wand2, title: "AI Generates Code", description: "CrewAI agents plan, write, and review your project via OpenRouter. Files are saved to Supabase and executed in WebContainer or E2B sandbox.", color: "text-chart-3", bg: "bg-chart-3/10 border-chart-3/20" },
  { step: "03", icon: MonitorPlay, title: "Preview & Deploy", description: "Live browser preview opens instantly. Edit, rebuild, and deploy to Vercel or GitHub in one click.", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
];

// ── Supported project types
const SUPPORTED_TYPES = [
  { icon: Code2, label: "HTML / CSS / JS" },
  { icon: Package, label: "React + Vite Apps" },
  { icon: Layers, label: "Tailwind CSS UI" },
  { icon: LayoutDashboard, label: "Frontend Dashboards" },
  { icon: Server, label: "Backend APIs" },
  { icon: Database, label: "Database Integration" },
  { icon: Lock, label: "Auth Systems" },
  { icon: Bot, label: "AI Chat Apps" },
  { icon: Smartphone, label: "Mobile-Style Apps" },
  { icon: Gamepad2, label: "2D / 3D Games" },
  { icon: Shield, label: "Admin Panels" },
  { icon: Globe, label: "SaaS Apps" },
  { icon: ShoppingCart, label: "E-commerce Sites" },
  { icon: Rocket, label: "Landing Pages" },
];

// ── Also supports
const ALSO_SUPPORTS = [
  { icon: Upload, label: "File Upload Projects" },
  { icon: MessageSquare, label: "Voice / Text Prompts" },
  { icon: GitBranch, label: "API Integrations" },
  { icon: Rocket, label: "One-Click Deploy (GitHub, Vercel)" },
  { icon: RefreshCw, label: "Live Code Editing" },
  { icon: Eye, label: "Instant Preview" },
];

// ── Live Preview features
const PREVIEW_FEATURES = [
  { icon: Globe, label: "Live Browser Preview", desc: "Full running app in the browser, not a screenshot." },
  { icon: RefreshCw, label: "Real-time Rendering", desc: "Changes reflect the moment you save or prompt." },
  { icon: Smartphone, label: "Mobile Responsive View", desc: "Toggle between desktop and mobile viewport." },
  { icon: Package, label: "Component Preview", desc: "Inspect individual components in isolation." },
  { icon: Eye, label: "Interactive Testing", desc: "Click, type, and test your app live in the preview." },
  { icon: Zap, label: "Instant Regenerate", desc: "Update prompt → AI rebuilds → preview refreshes." },
];

// ── Best at
const BEST_AT = [
  { icon: Zap, label: "Fast UI Generation", desc: "From prompt to polished UI in under 30 seconds." },
  { icon: Rocket, label: "Startup MVPs", desc: "Validate ideas fast with full-stack scaffolding." },
  { icon: Bot, label: "AI Apps", desc: "Chat UIs, LLM wrappers, intelligent dashboards." },
  { icon: LayoutDashboard, label: "Dashboard / Admin", desc: "Data-rich UIs with charts, tables, and CRUD." },
  { icon: Globe, label: "Clone Apps", desc: "Rebuild any popular app with your own twist." },
  { icon: Sparkles, label: "Modern Landing Pages", desc: "Conversion-focused hero sections and pricing pages." },
];

// ── Example prompts
const EXAMPLE_PROMPTS = [
  "Build a SaaS landing page with pricing tiers",
  "Create a restaurant website with animated menu",
  "Make a portfolio site with dark glassmorphism",
  "Build a Kanban task management dashboard",
  "Create an e-commerce product listing page",
  "Design a crypto portfolio tracker",
  "Build an AI chat app with OpenAI",
  "Create a 2D browser game with canvas",
];

// ── Real tech stack flow
const STACK_FLOW = [
  { label: "User Prompt",                sublabel: "Natural language input — describe anything",           color: "bg-chart-1",  border: "border-chart-1/40",  text: "text-chart-1",  icon: MessageSquare },
  { label: "CrewAI Planning",            sublabel: "Multi-agent orchestration & task breakdown",           color: "bg-info",     border: "border-info/40",     text: "text-info",     icon: Bot },
  { label: "OpenRouter Models",          sublabel: "LLM gateway — Claude, GPT-4, Gemini & more",          color: "bg-chart-3",  border: "border-chart-3/40",  text: "text-chart-3",  icon: Cpu },
  { label: "Generate Files",             sublabel: "React / Next.js / TypeScript full project output",    color: "bg-chart-4",  border: "border-chart-4/40",  text: "text-chart-4",  icon: Code2 },
  { label: "Save Files To Supabase",     sublabel: "Persist code, assets & project metadata",             color: "bg-chart-5",  border: "border-chart-5/40",  text: "text-chart-5",  icon: Database },
  { label: "Run In WebContainer / E2B",  sublabel: "Live browser runtime + isolated sandbox",             color: "bg-primary",  border: "border-primary/40",  text: "text-primary",  icon: MonitorPlay },
  { label: "Fix Errors Automatically",   sublabel: "Self-healing AI loop — zero manual debugging",        color: "bg-warning",  border: "border-warning/40",  text: "text-warning",  icon: RefreshCw },
  { label: "Deploy To Vercel",           sublabel: "Production URL live in seconds",                      color: "bg-chart-3",  border: "border-chart-3/40",  text: "text-chart-3",  icon: Rocket },
  { label: "Save Deployment URL",        sublabel: "URL stored in your Supabase project dashboard",       color: "bg-chart-1",  border: "border-chart-1/40",  text: "text-chart-1",  icon: Globe },
];

const STATS = [
  { value: "14+", label: "App Types" },
  { value: "5", label: "AI Agents" },
  { value: "Real-time", label: "Preview" },
  { value: "Free", label: "To Try" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [promptIndex, setPromptIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Redirect authenticated users
  useEffect(() => {
    if (user) navigate("/home", { replace: true });
  }, [user, navigate]);

  // Typewriter effect
  useEffect(() => {
    const currentPrompt = EXAMPLE_PROMPTS[promptIndex];
    let charIndex = 0;
    if (isTyping) {
      const interval = setInterval(() => {
        if (charIndex <= currentPrompt.length) {
          setTypedText(currentPrompt.slice(0, charIndex));
          charIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setPromptIndex((i) => (i + 1) % EXAMPLE_PROMPTS.length);
            setIsTyping(true);
          }, 2200);
        }
      }, 45);
      return () => clearInterval(interval);
    }
  }, [promptIndex, isTyping]);

  const handleStart = () => navigate(user ? "/home" : "/login");

  return (
    <div className="min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: "var(--gradient-glow)" }} />

      {/* ── Navigation ── */}
      <nav className="relative z-10 flex items-center justify-between px-4 md:px-12 py-4 border-b border-border/50">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold gradient-text">SiteGenie</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
          <a href="#capabilities" className="hover:text-foreground transition-colors">Capabilities</a>
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#preview" className="hover:text-foreground transition-colors">Live Preview</a>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" className="hidden md:inline-flex border border-border/60 text-foreground hover:bg-accent" onClick={() => navigate("/login")}>
            Sign In
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm px-4 py-2" onClick={handleStart}>
            Start Building <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 px-4 md:px-12 pt-12 md:pt-20 pb-16 md:pb-28 text-center">
        <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary/10 px-4 py-1.5 text-xs">
          <Star className="w-3 h-3 mr-1.5 fill-current" />
          AI-Powered App Builder — Prompt to Production in Minutes
        </Badge>
        <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold mb-5 leading-tight text-balance">
          Build Any App with{" "}
          <span className="gradient-text">AI Intelligence</span>
        </h1>
        <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty px-2">
          Type a prompt. SiteGenie's CrewAI agents plan and build your app via
          OpenRouter, run it in WebContainer or E2B, then deploy to Vercel —
          all in minutes.
        </p>

        {/* Typewriter prompt */}
        <div className="relative max-w-2xl mx-auto mb-8">
          <div className="glass rounded-xl p-4 flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Try asking SiteGenie...</p>
              <p className="text-foreground font-medium truncate text-sm md:text-base">
                {typedText}
                <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
              </p>
            </div>
            <Button size="sm" className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleStart}>
              <Play className="w-3.5 h-3.5 mr-1.5" /> Build
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 py-5 text-sm md:text-base w-full sm:w-auto" onClick={handleStart}>
            <Sparkles className="w-5 h-5 mr-2" /> Start Building Free
          </Button>
          <Button size="lg" variant="ghost" className="border border-border/60 text-foreground hover:bg-accent px-8 py-5 text-sm md:text-base w-full sm:w-auto" onClick={handleStart}>
            <Play className="w-5 h-5 mr-2" /> Watch Demo
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mx-auto mt-12">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl md:text-3xl font-bold gradient-text">{stat.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech Stack Ticker ── */}
      <section className="relative z-10 py-8 border-y border-border/40 bg-secondary/30 overflow-hidden">
        <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-4 font-medium">
          Technologies Generated & Supported
        </p>
        <div className="relative flex overflow-x-hidden">
          <div ref={tickerRef} className="flex gap-4 animate-marquee whitespace-nowrap">
            {[...TECH_STACK, ...TECH_STACK].map((tech, i) => (
              <Badge key={i} variant="outline" className="shrink-0 border-border/60 text-muted-foreground bg-background/50 px-3 py-1 text-xs font-medium">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workspace Preview ── */}
      <section className="relative z-10 px-4 md:px-12 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-2xl overflow-hidden shadow-card gradient-border">
            <div className="flex items-center gap-2 px-4 py-3 bg-secondary/80 border-b border-border">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-warning/60" />
              <div className="w-3 h-3 rounded-full bg-chart-3/60" />
              <div className="flex-1 flex justify-center">
                <span className="text-xs text-muted-foreground">SiteGenie Workspace — my-app</span>
              </div>
            </div>
            {/* Desktop: full mock editor */}
            <div className="hidden md:flex h-80">
              <div className="w-40 bg-sidebar border-r border-sidebar-border p-3 shrink-0">
                <p className="text-xs text-sidebar-foreground/60 uppercase tracking-wider mb-2 font-medium">Explorer</p>
                {[
                  { name: "src", isFolder: true }, { name: "App.tsx", isFolder: false, indent: true },
                  { name: "components", isFolder: true, indent: true }, { name: "Hero.tsx", isFolder: false, indent2: true },
                  { name: "styles", isFolder: true }, { name: "globals.css", isFolder: false, indent: true },
                ].map((item, i) => (
                  <div key={i} className={cn("flex items-center gap-1.5 py-0.5 text-xs rounded px-1",
                    item.name === "App.tsx" ? "text-primary bg-sidebar-accent" : "text-sidebar-foreground/70",
                    item.indent ? "pl-4" : "", (item as { indent2?: boolean }).indent2 ? "pl-7" : "")}>
                    {item.isFolder ? <ChevronRight className="w-3 h-3" /> : <div className="w-3 h-3 rounded-sm bg-current opacity-40" />}
                    {item.name}
                  </div>
                ))}
              </div>
              <div className="w-56 bg-editor-panel border-r border-editor-border p-3 shrink-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">AI Chat</p>
                <div className="space-y-2">
                  <div className="rounded-lg bg-secondary p-2"><p className="text-xs text-muted-foreground">Build a SaaS landing page</p></div>
                  <div className="rounded-lg bg-primary/15 p-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs text-primary font-medium">SiteGenie</span>
                    </div>
                    <p className="text-xs text-foreground/80">Generated 6 files including Hero, Pricing, and Footer components...</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0 bg-editor-bg p-3">
                <div className="flex items-center gap-1 mb-3 border-b border-editor-border pb-2">
                  <span className="text-xs px-3 py-1 bg-editor-bg border-b-2 border-primary text-foreground font-medium">App.tsx</span>
                  <span className="text-xs px-3 py-1 text-muted-foreground">Hero.tsx</span>
                </div>
                <div className="font-mono text-xs space-y-1 text-foreground/80">
                  <p><span className="text-chart-5">import</span> <span className="text-info">React</span> <span className="text-chart-5">from</span> <span className="text-chart-3">'react'</span></p>
                  <p><span className="text-chart-5">import</span> <span className="text-info">{"{ Hero }"}</span> <span className="text-chart-5">from</span> <span className="text-chart-3">'./components/Hero'</span></p>
                  <p className="text-muted-foreground">&nbsp;</p>
                  <p><span className="text-chart-5">export default function</span> <span className="text-chart-4">App</span><span className="text-foreground">() {"{"}</span></p>
                  <p>&nbsp;&nbsp;<span className="text-chart-5">return</span> <span className="text-foreground">(</span></p>
                  <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-chart-1">{"<Hero"}</span> <span className="text-info">title</span><span className="text-foreground">=</span><span className="text-chart-3">"Welcome"</span> <span className="text-chart-1">{"/>"}</span></p>
                </div>
              </div>
            </div>
            {/* Mobile: compact chat preview */}
            <div className="md:hidden p-4 bg-editor-bg space-y-3">
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground">Build a SaaS landing page with Tailwind</p>
              </div>
              <div className="rounded-lg bg-primary/15 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs text-primary font-medium">SiteGenie</span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">Generated 6 files: App.tsx, Hero.tsx, Pricing.tsx, Footer.tsx, globals.css, routes.tsx</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {["App.tsx", "Hero.tsx", "Pricing.tsx"].map(f => (
                  <span key={f} className="text-xs px-2 py-1 rounded bg-editor-panel text-foreground/70 font-mono">{f}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative z-10 px-4 md:px-12 py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-balance">From Prompt to Live App in 3 Steps</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">No configuration. No boilerplate. Just describe what you want.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="glass rounded-2xl p-6 h-full flex flex-col text-center hover:border-primary/30 transition-all duration-300" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4", step.bg)}>
                    <Icon className={cn("w-7 h-7", step.color)} />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground mb-1">{step.step}</span>
                  <h3 className="font-semibold text-lg text-foreground mb-2 text-balance">{step.title}</h3>
                  <p className="text-sm text-muted-foreground flex-1 text-pretty">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Capabilities: Supported Types ── */}
      <section id="capabilities" className="relative z-10 px-4 md:px-12 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-balance">Build Anything You Can Imagine</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              SiteGenie supports every major web project type — from simple landing pages to complex full-stack applications.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {SUPPORTED_TYPES.map(({ icon: Icon, label }) => (
              <div key={label} className="glass rounded-xl p-4 flex flex-col items-center gap-2 text-center hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-default group">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs text-foreground font-medium leading-tight">{label}</span>
              </div>
            ))}
          </div>

          {/* Also supports row */}
          <div className="mt-10 glass rounded-2xl p-6">
            <p className="text-sm font-semibold text-foreground mb-4">Also Supports</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {ALSO_SUPPORTS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-chart-3/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-chart-3" />
                  </div>
                  <span className="text-sm text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Live Preview Features ── */}
      <section id="preview" className="relative z-10 px-4 md:px-12 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-balance">
              Live Preview — See It Run Instantly
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Not a static mockup. A real running application in your browser, updating in real-time as you prompt or edit.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PREVIEW_FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass rounded-xl p-5 h-full flex gap-4 hover:border-primary/30 transition-all duration-300" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-info" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm mb-1 text-balance">{label}</p>
                  <p className="text-xs text-muted-foreground text-pretty">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="relative z-10 px-4 md:px-12 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-balance">A Complete AI Dev Environment</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">Not a website template generator — a real AI-powered IDE with live preview and deployment.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="glass rounded-xl p-6 h-full flex flex-col hover:border-primary/30 transition-all duration-300" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${feature.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-balance">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground flex-1 text-pretty">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Best At ── */}
      <section className="relative z-10 px-4 md:px-12 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-balance">SiteGenie Is Best At</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">Purpose-built for the most in-demand modern development workflows.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BEST_AT.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass rounded-xl p-6 h-full flex flex-col gap-3 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-balance">{label}</h3>
                </div>
                <p className="text-sm text-muted-foreground text-pretty">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Mission ── */}
      <section className="relative z-10 px-4 md:px-12 py-14 md:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="glass rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0"
               style={{ background: "linear-gradient(135deg, hsl(263 60% 97%) 0%, hsl(244 40% 95%) 100%)" }}>
            {/* Left — developer photo */}
            <div className="relative flex flex-col items-center justify-end bg-gradient-to-br from-primary/5 to-primary/10 p-6 md:p-8 min-h-[260px] md:min-h-[340px]">
              <img
                src="https://miaoda-conversation-file.s3cdn.medo.dev/user-apbxpv84bnk0/app-by0e6zc8dh4x/20260530/ChatGPT Image May 29, 2026, 11_20_42 PM.png"
                alt="Chinthala Baji — Developer"
                className="w-40 md:w-56 h-52 md:h-72 object-cover object-top rounded-2xl shadow-lg"
              />
              <p className="mt-4 text-xs text-muted-foreground text-center">
                Developed by{" "}
                <a href="https://github.com/chinthalabaji" target="_blank" rel="noreferrer"
                   className="font-semibold gradient-text hover:underline">
                  Chinthala Baji
                </a>
              </p>
            </div>

            {/* Right — mission text */}
            <div className="flex flex-col justify-center p-6 md:p-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-6 w-fit">
                <Sparkles className="w-3 h-3" /> Our Mission
              </span>
              <h2 className="text-2xl md:text-3xl font-bold mb-6 leading-tight text-balance">
                SiteGenie is your{" "}
                <span className="gradient-text">full-stack co-pilot</span>
              </h2>
              <ul className="space-y-4 mb-8">
                {[
                  { emoji: "⚡", text: "Develop and publish apps with a single prompt — no code needed." },
                  { emoji: "🎨", text: "Design SaaS pages, websites, and apps exactly the way you vision them." },
                  { emoji: "🌐", text: "From landing pages to full-stack platforms — we build it all." },
                  { emoji: "✨", text: "Make your dreams execute. Turn ideas into live products today." },
                ].map(({ emoji, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="text-base leading-none mt-0.5 shrink-0">{emoji}</span>
                    <span className="text-pretty">{text}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold w-fit"
                onClick={handleStart}
              >
                <Sparkles className="w-4 h-4 mr-2" /> Start Building
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Build Pipeline ── */}
      <section className="relative z-10 px-4 md:px-12 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-4">
              <Cpu className="w-3 h-3" /> Automated Build Pipeline
            </span>
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-balance">
              From Prompt to Production
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Every prompt triggers a 9-step fully automated pipeline — AI plans, codes,
              tests, fixes, and deploys your app without you lifting a finger.
            </p>
          </div>

          {/* Pipeline steps */}
          <div className="relative">
            {/* Vertical spine line (desktop) */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent hidden md:block -translate-x-1/2" />

            <div className="flex flex-col gap-3">
              {STACK_FLOW.map((node, i) => {
                const Icon = node.icon;
                const isLast = i === STACK_FLOW.length - 1;
                const isEven = i % 2 === 0;
                return (
                  <div key={node.label}>
                    {/* Desktop: alternating left/right */}
                    <div className={`hidden md:flex items-center gap-6 ${isEven ? "flex-row" : "flex-row-reverse"}`}>
                      {/* Card */}
                      <div className="flex-1">
                        <div className={`glass rounded-2xl p-4 border ${node.border} hover:shadow-lg transition-all duration-300 group`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl ${node.color} flex items-center justify-center shrink-0`}>
                              <Icon className="w-4 h-4 text-background" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground leading-tight">{node.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{node.sublabel}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Center step badge */}
                      <div className="shrink-0 flex flex-col items-center gap-1 relative z-10">
                        <div className={`w-10 h-10 rounded-full ${node.color} flex items-center justify-center shadow-lg`}>
                          <span className="text-xs font-bold text-background">{String(i + 1).padStart(2, "0")}</span>
                        </div>
                        {!isLast && <div className="w-px h-6 bg-border/60" />}
                      </div>
                      {/* Spacer for opposite side */}
                      <div className="flex-1" />
                    </div>

                    {/* Mobile: straight vertical list */}
                    <div className="md:hidden flex gap-3">
                      {/* Left: step number + line */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`w-8 h-8 rounded-full ${node.color} flex items-center justify-center shadow-md shrink-0`}>
                          <Icon className="w-3.5 h-3.5 text-background" />
                        </div>
                        {!isLast && <div className="w-px flex-1 mt-1 bg-border/50 min-h-[16px]" />}
                      </div>
                      {/* Right: content */}
                      <div className={`pb-3 ${isLast ? "" : ""}`}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-mono font-bold ${node.text}`}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <p className="text-sm font-semibold text-foreground leading-tight">{node.label}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{node.sublabel}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tech stack badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {[
              { label: "CrewAI",       color: "border-chart-1/40 text-chart-1" },
              { label: "OpenRouter",   color: "border-info/40 text-info" },
              { label: "React/Next.js",color: "border-chart-4/40 text-chart-4" },
              { label: "Supabase",     color: "border-chart-5/40 text-chart-5" },
              { label: "WebContainer", color: "border-primary/40 text-primary" },
              { label: "E2B",          color: "border-chart-3/40 text-chart-3" },
              { label: "Vercel",       color: "border-chart-3/40 text-chart-3" },
            ].map(({ label, color }) => (
              <span key={label}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-background/40 ${color}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Example Prompts ── */}
      <section className="relative z-10 px-4 md:px-12 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-balance">What Can You Build?</h2>
            <p className="text-muted-foreground text-pretty">Click any example to open the workspace and start building.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button key={prompt} type="button"
                className="glass rounded-xl p-4 flex items-center gap-3 text-left hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
                onClick={() => navigate(`/workspace/new?prompt=${encodeURIComponent(prompt)}`)}>
                <Sparkles className="w-4 h-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-sm text-foreground">{prompt}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 px-4 md:px-12 py-14 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-2xl p-6 md:p-14 gradient-border" style={{ background: "var(--gradient-hero)" }}>
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-balance">Ready to Build Something Amazing?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-pretty">
              Join the future of app development. No credit card required.
              Prompt → Generate → Preview → Deploy in minutes.
            </p>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 py-5 text-sm md:text-base w-full sm:w-auto" onClick={handleStart}>
              <Sparkles className="w-5 h-5 mr-2" /> Start Building Free
            </Button>
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mt-5 text-xs md:text-sm text-muted-foreground">
              {["No credit card", "Instant preview", "GitHub + Vercel deploy", "14+ project types"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-chart-3" />{item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 px-4 md:px-12 py-8 border-t border-border/50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-medium gradient-text">SiteGenie</span>
            <span>— AI App Builder</span>
          </div>
          <p>Built with React, Vite, Tailwind CSS, and Gemini AI</p>
        </div>
        <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">
            Developed by{" "}
            <span className="font-semibold text-foreground">Professional Developer</span>
            {" · "}
            <span className="font-semibold gradient-text">Chinthala Baji</span>
            {" "}
            <span className="text-muted-foreground">from Telangana, India 🇮🇳</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
