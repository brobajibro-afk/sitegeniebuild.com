import React, { useMemo, useState } from "react";
import {
  SandpackProvider,
  SandpackPreview,
  SandpackConsole,
  useActiveCode,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Smartphone,
  Monitor,
  Eye,
  Terminal,
  ExternalLink,
  Loader2,
  FileCode2,
} from "lucide-react";
import type { Framework, VirtualFileSystem } from "@/types/types";
import { getFrameworkConfig } from "@/lib/frameworks";
import { cn } from "@/lib/utils";

// Convert our VirtualFileSystem to Sandpack format
function toSandpackFiles(files: VirtualFileSystem) {
  const sandpackFiles: Record<string, { code: string; active?: boolean }> = {};

  // Normalize file paths for Sandpack (ensure they start with /)
  for (const [path, code] of Object.entries(files)) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    sandpackFiles[normalizedPath] = { code };
  }

  // Ensure we have an App.tsx entry point
  if (!sandpackFiles["/App.tsx"] && !sandpackFiles["/app/page.tsx"]) {
    sandpackFiles["/App.tsx"] = {
      code: `import React from 'react';
export default function App() {
  return <div style={{padding:'2rem',fontFamily:'system-ui'}}>Loading...</div>;
}`,
    };
  }

  // Add index.tsx if missing
  if (!sandpackFiles["/index.tsx"] && !sandpackFiles["/index.jsx"]) {
    sandpackFiles["/index.tsx"] = {
      code: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
`,
    };
  }

  return sandpackFiles;
}

// Inner component that has access to Sandpack context
function PreviewContent({
  viewMode,
  setViewMode,
}: {
  viewMode: "desktop" | "mobile";
  setViewMode: (mode: "desktop" | "mobile") => void;
}) {
  const { dispatch } = useSandpack();
  const [activeTab, setActiveTab] = useState<"preview" | "console">("preview");

  const handleRefresh = () => {
    dispatch({ type: "refresh" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Preview toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-editor-border bg-editor-panel shrink-0">
        <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2 text-xs gap-1",
              activeTab === "preview" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("preview")}
          >
            <Eye className="w-3 h-3" />
            Preview
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2 text-xs gap-1",
              activeTab === "console" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("console")}
          >
            <Terminal className="w-3 h-3" />
            Console
          </Button>
        </div>

        <div className="flex-1" />

        {/* Viewport toggles */}
        <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6",
              viewMode === "desktop"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setViewMode("desktop")}
            title="Desktop view"
          >
            <Monitor className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6",
              viewMode === "mobile"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setViewMode("mobile")}
            title="Mobile view"
          >
            <Smartphone className="w-3 h-3" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={handleRefresh}
          title="Refresh preview"
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>

      {/* Preview area */}
      <div className="flex-1 min-h-0 bg-white overflow-hidden relative">
        {activeTab === "preview" ? (
          <div
            className={cn(
              "h-full transition-all duration-300",
              viewMode === "mobile"
                ? "max-w-[390px] mx-auto border-x border-border shadow-lg"
                : "w-full"
            )}
          >
            <SandpackPreview
              style={{ height: "100%" }}
              showNavigator={false}
              showOpenInCodeSandbox={false}
              showRefreshButton={false}
              showOpenNewtab={false}
            />
          </div>
        ) : (
          <div className="h-full bg-editor-bg">
            <SandpackConsole
              style={{ height: "100%" }}
              showHeader={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface LivePreviewProps {
  files: VirtualFileSystem;
  isGenerating: boolean;
  framework?: Framework;
}

// Backend frameworks have no live preview — show a file tree + README instead
function BackendScaffoldView({ files }: { files: VirtualFileSystem }) {
  const [selected, setSelected] = useState<string | null>(
    Object.keys(files).find((f) => f.toLowerCase().includes("readme")) ?? Object.keys(files)[0] ?? null
  );
  const fileList = Object.keys(files).sort();

  return (
    <div className="flex h-full text-xs font-mono">
      {/* file list */}
      <div className="w-44 shrink-0 border-r border-editor-border overflow-y-auto bg-editor-panel">
        <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Files</p>
        {fileList.map((f) => (
          <button
            key={f}
            onClick={() => setSelected(f)}
            className={cn(
              "w-full text-left px-3 py-1.5 truncate hover:bg-accent transition-colors",
              selected === f ? "bg-primary/10 text-primary" : "text-muted-foreground"
            )}
          >
            {f.replace(/^\//, "")}
          </button>
        ))}
      </div>
      {/* file content */}
      <div className="flex-1 min-w-0 overflow-auto p-4 bg-editor-bg">
        {selected ? (
          <pre className="text-[11px] text-foreground/80 whitespace-pre-wrap break-words leading-relaxed">
            {files[selected]}
          </pre>
        ) : (
          <p className="text-muted-foreground">Select a file to view</p>
        )}
      </div>
    </div>
  );
}

export function LivePreview({ files, isGenerating, framework = "react-ts" }: LivePreviewProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const fwConfig = getFrameworkConfig(framework);

  const sandpackFiles = useMemo(() => toSandpackFiles(files), [files]);

  // Backend scaffold: no Sandpack, show file browser
  if (fwConfig.isBackend) {
    return (
      <div className="flex flex-col h-full bg-editor-panel">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-editor-border shrink-0 bg-editor-panel">
          <FileCode2 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground/70 uppercase tracking-wider">
            {fwConfig.icon} {fwConfig.label} Scaffold
          </span>
          {isGenerating && (
            <div className="flex items-center gap-1.5 ml-auto">
              <Loader2 className="w-3 h-3 text-primary animate-spin" />
              <span className="text-[10px] text-primary">Generating...</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-h-0">
          <BackendScaffoldView files={files} />
        </div>
      </div>
    );
  }

  const sandpackTemplate = fwConfig.sandpackTemplate ?? "react-ts";

  return (
    <div className="flex flex-col h-full bg-editor-panel">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-editor-border shrink-0 bg-editor-panel">
        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground/70 uppercase tracking-wider">
          Live Preview
        </span>
        {isGenerating && (
          <div className="flex items-center gap-1.5 ml-auto">
            <Loader2 className="w-3 h-3 text-primary animate-spin" />
            <span className="text-[10px] text-primary">Updating...</span>
          </div>
        )}
      </div>

      {/* Sandpack */}
      <div className="flex-1 min-h-0">
        <SandpackProvider
          key={`${framework}-${JSON.stringify(Object.keys(sandpackFiles).sort())}`}
          files={sandpackFiles}
          template={sandpackTemplate as "react-ts"}
          theme="dark"
          options={{
            recompileMode: "delayed",
            recompileDelay: 500,
            externalResources: [
              "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap",
            ],
          }}
          customSetup={
            framework === "react-ts"
              ? { dependencies: { react: "^18.0.0", "react-dom": "^18.0.0" } }
              : framework === "react-js"
              ? { dependencies: { react: "^18.0.0", "react-dom": "^18.0.0" } }
              : framework === "vue"
              ? { dependencies: { vue: "^3.0.0" } }
              : undefined
          }
        >
          <PreviewContent
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </SandpackProvider>
      </div>
    </div>
  );
}
