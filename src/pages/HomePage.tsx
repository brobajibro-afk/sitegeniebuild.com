// HomePage — prompt-centric home for authenticated users
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layouts/AppShell";
import {
  ChevronRight,
  ArrowUp,
  Upload,
  Wand2,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!prompt.trim()) return;
    if (!user) { navigate("/login"); return; }
    navigate(`/workspace/new?prompt=${encodeURIComponent(prompt.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col h-full overflow-y-auto">

        {/* ── Hero Banner — fills the full available space ── */}
        <div
          className="relative flex-1 flex flex-col items-center justify-center overflow-hidden"
          style={{
            minHeight: "100%",
            background: "linear-gradient(135deg, hsl(244 30% 96%) 0%, hsl(263 60% 92%) 40%, hsl(263 70% 88%) 70%, hsl(280 60% 90%) 100%)",
          }}
        >
          {/* Watermark */}
          <span
            className="absolute inset-0 flex items-center justify-center text-[clamp(80px,18vw,200px)] font-black select-none pointer-events-none"
            style={{ color: "hsl(263 70% 52% / 0.07)", letterSpacing: "-0.02em" }}
            aria-hidden
          >
            SiteGenie
          </span>

          {/* Mascot blob — hidden on very small screens */}
          <div
            className="absolute right-4 md:right-20 lg:right-32 bottom-0 w-28 h-28 md:w-44 md:h-44 pointer-events-none select-none hidden sm:block"
            aria-hidden
          >
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <ellipse cx="100" cy="120" rx="60" ry="65" fill="#6D28D9" />
              <ellipse cx="100" cy="72"  rx="44" ry="42" fill="#7C3AED" />
              <ellipse cx="86"  cy="70"  rx="8"  ry="9"  fill="white" />
              <ellipse cx="114" cy="70"  rx="8"  ry="9"  fill="white" />
              <ellipse cx="88"  cy="72"  rx="4"  ry="5"  fill="#1e1b4b" />
              <ellipse cx="116" cy="72"  rx="4"  ry="5"  fill="#1e1b4b" />
              <path d="M88 88 Q100 98 112 88" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M148 30 L158 45 L148 60 L138 45 Z" fill="#EC4899" />
              <path d="M148 30 L158 45 L148 45 Z" fill="#F9A8D4" />
              <path d="M48 130 Q30 110 42 95"   stroke="#7C3AED" strokeWidth="16" strokeLinecap="round" fill="none" />
              <path d="M152 130 Q170 110 158 95" stroke="#6D28D9" strokeWidth="16" strokeLinecap="round" fill="none" />
              <ellipse cx="80"  cy="178" rx="22" ry="12" fill="#5B21B6" />
              <ellipse cx="120" cy="178" rx="22" ry="12" fill="#5B21B6" />
            </svg>
          </div>

          {/* Headline */}
          <div className="relative z-10 text-center px-6 pt-10 pb-5">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-balance leading-tight">
              Prompt{" "}
              <span className="gradient-text">Your</span>{" "}
              <span style={{ color: "hsl(244 20% 12%)" }}>Next App</span>
            </h1>
            <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-md mx-auto text-pretty hidden sm:block">
              Describe any app or website — AI builds it in minutes, ready to deploy.
            </p>
          </div>

          {/* Prompt Input Box */}
          <div className="relative z-10 w-full max-w-2xl mx-auto px-4 pb-12">
            <div className="bg-background rounded-2xl shadow-2xl border border-border/40 overflow-hidden">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the app or website you want to build…"
                rows={3}
                className="w-full px-5 pt-5 pb-2 text-sm text-foreground placeholder:text-muted-foreground bg-transparent resize-none outline-none leading-relaxed"
              />
              {/* Toolbar */}
              <div className="flex items-center gap-1.5 px-3 pb-3 pt-1 flex-wrap">
                <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border/60 bg-muted/50 hover:bg-muted text-foreground transition-colors shrink-0">
                  <Wand2 className="w-3 h-3" />
                  Deep Build
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </button>
                <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border/60 bg-muted/50 hover:bg-muted text-foreground transition-colors shrink-0">
                  <Upload className="w-3 h-3" />
                  Upload
                </button>
                <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border/60 bg-muted/50 hover:bg-muted text-foreground transition-colors shrink-0">
                  <Wand2 className="w-3 h-3" />
                  Skills
                </button>
                <div className="flex-1 min-w-2" />
                <button type="button" className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0" aria-label="Filter">
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!prompt.trim()}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full transition-all shrink-0",
                    prompt.trim()
                      ? "bg-foreground text-background hover:opacity-80"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                  aria-label="Send"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
