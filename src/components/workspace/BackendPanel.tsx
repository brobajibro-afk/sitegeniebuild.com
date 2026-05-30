import React, { useState } from "react";
import { Database, Server, CheckCircle, Copy, Check } from "lucide-react";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackendPanelProps {
  output: string;
  isGenerating: boolean;
}

export function BackendPanel({ output, isGenerating }: BackendPanelProps) {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<"schema" | "api">("schema");

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split output into schema and API sections
  const schemaContent = output
    ? output.split(/api|endpoint|route/i)[0] || output
    : "";
  const apiContent = output
    ? output.split(/api endpoint|rest api|endpoints:/i)[1] || ""
    : "";

  return (
    <div className="flex flex-col h-full bg-editor-panel">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-editor-border shrink-0">
        <div className="w-5 h-5 rounded-md bg-chart-2/20 flex items-center justify-center">
          <Database className="w-3 h-3 text-chart-2" />
        </div>
        <span className="text-xs font-semibold text-foreground">Backend & DB</span>
        {isGenerating && (
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-chart-2 animate-pulse" />
            <span className="text-[10px] text-chart-2">Generating...</span>
          </div>
        )}
        {output && !isGenerating && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 ml-auto text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
          >
            {copied ? <Check className="w-3 h-3 text-chart-3" /> : <Copy className="w-3 h-3" />}
          </Button>
        )}
      </div>

      {/* Sub-tabs */}
      {output && (
        <div className="flex border-b border-editor-border shrink-0">
          {[
            { id: "schema" as const, label: "DB Schema", icon: Database },
            { id: "api" as const, label: "API Spec", icon: Server },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                activeSection === id
                  ? "border-chart-2 text-chart-2"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveSection(id)}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {!output && !isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
            <div className="w-10 h-10 rounded-xl bg-chart-2/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-chart-2/50" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground/50">No backend schema yet</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Generate a project to see the database schema and API spec
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Agent badge */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-chart-2/10 border border-chart-2/20">
              <CheckCircle className="w-3.5 h-3.5 text-chart-2 shrink-0" />
              <span className="text-[11px] text-chart-2 font-medium">Backend Agent — Completed</span>
            </div>

            <div className="prose-sm prose-invert max-w-none text-xs leading-relaxed text-foreground/80
              [&_h1]:text-sm [&_h1]:font-semibold [&_h1]:text-foreground [&_h1]:mb-2 [&_h1]:mt-3
              [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mb-1.5 [&_h2]:mt-2.5
              [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-2.5 [&_pre]:overflow-x-auto [&_pre]:text-[10px]
              [&_code]:text-chart-2 [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_code]:text-[10px]
              [&_p]:mb-2 [&_strong]:text-foreground [&_ul]:space-y-1 [&_li]:text-xs">
              <Streamdown parseIncompleteMarkdown isAnimating={isGenerating}>
                {activeSection === "api" && apiContent ? apiContent : schemaContent || output || "Generating backend schema..."}
              </Streamdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
