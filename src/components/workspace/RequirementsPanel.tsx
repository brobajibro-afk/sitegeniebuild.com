import React from "react";
import { Sparkles, CheckCircle, Circle, ArrowRight, FileText } from "lucide-react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

interface RequirementsPanelProps {
  output: string;
  isGenerating: boolean;
}

export function RequirementsPanel({ output, isGenerating }: RequirementsPanelProps) {
  return (
    <div className="flex flex-col h-full bg-editor-panel">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-editor-border shrink-0">
        <div className="w-5 h-5 rounded-md bg-chart-3/20 flex items-center justify-center">
          <FileText className="w-3 h-3 text-chart-3" />
        </div>
        <span className="text-xs font-semibold text-foreground">Requirements</span>
        {isGenerating && (
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-chart-3 animate-pulse" />
            <span className="text-[10px] text-chart-3">Analyzing...</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {!output && !isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
            <div className="w-10 h-10 rounded-xl bg-chart-3/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-chart-3/50" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground/50">No requirements yet</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Generate a project to see the requirements analysis
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Agent badge */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-chart-3/10 border border-chart-3/20">
              <CheckCircle className="w-3.5 h-3.5 text-chart-3 shrink-0" />
              <span className="text-[11px] text-chart-3 font-medium">Requirements Agent — Completed</span>
            </div>

            {/* Output */}
            <div className="prose-sm prose-invert max-w-none text-xs leading-relaxed text-foreground/80
              [&_h1]:text-sm [&_h1]:font-semibold [&_h1]:text-foreground [&_h1]:mb-2 [&_h1]:mt-3
              [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mb-1.5 [&_h2]:mt-2.5
              [&_h3]:text-xs [&_h3]:font-medium [&_h3]:text-foreground/80
              [&_ul]:space-y-1 [&_li]:text-xs [&_li]:leading-relaxed
              [&_p]:mb-2 [&_strong]:text-foreground [&_code]:text-chart-3 [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded">
              <Streamdown parseIncompleteMarkdown isAnimating={isGenerating}>
                {output || "Analyzing requirements..."}
              </Streamdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface AgentPipelineProps {
  steps: { id: string; label: string; status: "pending" | "running" | "completed" | "error" }[];
}

export function AgentPipelineStatus({ steps }: AgentPipelineProps) {
  const hasActive = steps.some((s) => s.status !== "pending");
  if (!hasActive) return null;

  return (
    <div className="px-3 py-2 border-b border-editor-border bg-muted/20 shrink-0">
      <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium mb-1.5">
        Agent Pipeline
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        {steps.flatMap((step, i) => {
          const items = [
            <div
              key={`step-${step.id}`}
              className={cn(
                "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md",
                step.status === "running" ? "bg-primary/15 text-primary" :
                step.status === "completed" ? "bg-chart-3/15 text-chart-3" :
                step.status === "error" ? "bg-destructive/15 text-destructive" :
                "bg-muted text-muted-foreground"
              )}
            >
              {step.status === "running" ? (
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              ) : step.status === "completed" ? (
                <CheckCircle className="w-2.5 h-2.5" />
              ) : (
                <Circle className="w-2.5 h-2.5 opacity-40" />
              )}
              <span className="font-medium">{step.label.replace(" Agent", "")}</span>
            </div>,
          ];
          if (i < steps.length - 1) {
            items.push(
              <ArrowRight key={`arrow-${step.id}`} className="w-2.5 h-2.5 text-muted-foreground/30 shrink-0" />
            );
          }
          return items;
        })}
      </div>
    </div>
  );
}
