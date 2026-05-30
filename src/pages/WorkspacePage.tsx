// WorkspacePage — MeDo-style: thin topbar + 40px icon strip + main area + right chat
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Code2,
  FileText,
  Plus,
  FolderOpen,
  Save,
  Search,
  ExternalLink,
  Database,
  Coins,
  Bot,
  Globe,
  Rocket,
  RefreshCw,
  PanelLeftOpen,
  ChevronLeft,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/contexts/AuthContext";
import { AIChatPanel } from "@/components/workspace/AIChatPanel";
import { FileExplorer } from "@/components/workspace/FileExplorer";
import { CodeEditor } from "@/components/workspace/CodeEditor";
import { LivePreview } from "@/components/workspace/LivePreview";
import { RequirementsPanel } from "@/components/workspace/RequirementsPanel";
import { BackendPanel } from "@/components/workspace/BackendPanel";
import { TerminalPanel } from "@/components/workspace/TerminalPanel";
import { CommandPalette } from "@/components/workspace/CommandPalette";
import { SearchReplace } from "@/components/workspace/SearchReplace";
import { PluginRegistry } from "@/components/workspace/PluginRegistry";
import { VersionHistory } from "@/components/workspace/VersionHistory";
import { DeployPublish } from "@/components/workspace/DeployPublish";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type WorkspaceTab = "preview" | "requirements" | "code" | "backend";
type StripPanel = "files" | "preview" | "requirements" | "code" | "backend";

function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    const cb = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === "k") { e.preventDefault(); ref.current["cmd-k"]?.(); }
      if (meta && e.key === "f") { e.preventDefault(); ref.current["cmd-f"]?.(); }
      if (meta && e.key === "s") { e.preventDefault(); ref.current["cmd-s"]?.(); }
      if (meta && e.key === "`") { e.preventDefault(); ref.current["cmd-backtick"]?.(); }
    };
    window.addEventListener("keydown", cb);
    return () => window.removeEventListener("keydown", cb);
  }, []);
}

export default function WorkspacePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: projectId } = useParams<{ id: string }>();
  const { user, profile, tokenBalance, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("preview");
  const [stripPanel, setStripPanel] = useState<StripPanel>("preview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [showPlugins, setShowPlugins] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showDeploy, setShowDeploy] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);

  const {
    state,
    openFile,
    closeFile,
    updateFileContent,
    sendMessage,
    cancelGeneration,
    resetProject,
    saveVersion,
    togglePlugin,
    setFramework,
  } = useWorkspace(projectId ?? null);

  // Sync activeTab → stripPanel
  useEffect(() => {
    if (activeTab === "preview") setStripPanel("preview");
    else if (activeTab === "requirements") setStripPanel("requirements");
    else if (activeTab === "code") setStripPanel("code");
    else if (activeTab === "backend") setStripPanel("backend");
  }, [activeTab]);

  // Auto-prompt from URL
  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (prompt) setTimeout(() => sendMessage(prompt), 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When generating → show requirements
  useEffect(() => {
    if (state.isGenerating) { setActiveTab("requirements"); setStripPanel("requirements"); }
  }, [state.isGenerating]);

  // When code ready → show preview
  useEffect(() => {
    if (Object.keys(state.files).length > 0 && !state.isGenerating) {
      setActiveTab("preview"); setStripPanel("preview");
    }
  }, [state.files, state.isGenerating]);

  const handleSaveVersion = useCallback(async () => {
    if (savingVersion) return;
    setSavingVersion(true);
    await saveVersion(`Snapshot ${new Date().toLocaleTimeString()}`);
    setSavingVersion(false);
  }, [saveVersion, savingVersion]);

  const handleRestoreVersion = useCallback((files: Record<string, string>) => {
    for (const [path, content] of Object.entries(files)) updateFileContent(path, content);
    toast.success("Version restored");
  }, [updateFileContent]);

  useKeyboardShortcuts({
    "cmd-k": () => setShowCommandPalette(true),
    "cmd-f": () => setShowSearchReplace(true),
    "cmd-s": handleSaveVersion,
    "cmd-backtick": () => setShowTerminal(v => !v),
  });

  const displayName = profile?.username || user?.email?.split("@")[0] || "U";

  const selectStrip = (id: StripPanel) => {
    setStripPanel(id);
    if (id !== "files") setActiveTab(id as WorkspaceTab);
  };

  const stripItems: { id: StripPanel; icon: React.ElementType; label: string }[] = [
    { id: "files",        icon: FolderOpen,  label: "Files" },
    { id: "preview",      icon: Globe,       label: "Preview" },
    { id: "requirements", icon: FileText,    label: "Requirements" },
    { id: "code",         icon: Code2,       label: "Code Editor" },
    { id: "backend",      icon: Database,    label: "Backend" },
  ];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">

      {/* ═══ MeDo thin top bar (h-10) ═══ */}
      <div className="flex items-center h-10 px-3 gap-2 border-b border-border bg-background shrink-0">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          aria-label="Back"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setSidebarCollapsed(v => !v)}
          className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          aria-label="Toggle strip"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 min-w-0 max-w-[100px] md:max-w-[200px]">
          <span className="text-sm font-semibold text-foreground truncate">
            {state.projectName || "New Project"}
          </span>
          <button type="button" className="w-5 h-5 hidden sm:flex items-center justify-center rounded text-muted-foreground hover:text-foreground shrink-0" aria-label="Rename">
            <Pencil className="w-3 h-3" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowVersionHistory(true)}
          className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md border border-border/60 bg-muted/40 text-xs font-medium text-foreground hover:bg-muted transition-colors shrink-0"
        >
          v{state.projectId ? "20" : "1"}
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" aria-label="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => selectStrip("code")}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-md transition-colors",
              stripPanel === "code" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            aria-label="Code editor"
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/subscription")}
            className="flex items-center gap-1 px-2 py-1 rounded-md border border-primary/25 bg-primary/5 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
          >
            <Coins className="w-3 h-3" />
            <span>{tokenBalance.toLocaleString()}</span>
            <span className="hidden md:inline">Credits</span>
          </button>

          <button type="button" className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-muted/40 text-xs font-medium text-foreground hover:bg-muted transition-colors">
            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:inline">Collaboration</span>
          </button>

          <Button size="sm" className="h-7 px-2 md:px-3 gap-1.5 text-[11px] bg-foreground text-background hover:opacity-80 shrink-0" onClick={() => setShowDeploy(true)}>
            <Rocket className="w-3 h-3" />
            <span className="hidden sm:inline">Update</span>
          </Button>
        </div>
      </div>

      {/* ═══ Body: icon strip | main | chat ═══ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* 40px icon strip */}
        {!sidebarCollapsed && (
          <div className="hidden md:flex flex-col items-center w-10 shrink-0 border-r border-border bg-background py-2 gap-1">
            {stripItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => selectStrip(id)}
                title={label}
                aria-label={label}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                  stripPanel === id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
            <div className="flex-1" />
            <button type="button" onClick={handleSaveVersion} disabled={savingVersion} title="Save version" aria-label="Save version"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              <Save className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setShowSearchReplace(true)} title="Search" aria-label="Search"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">

          {stripPanel === "files" && (
            <div className="flex flex-1 min-h-0 overflow-hidden">
              <div className="w-56 shrink-0 border-r border-border overflow-hidden flex flex-col">
                <FileExplorer files={state.files} activeFile={state.activeFile} onSelectFile={openFile} onReset={resetProject} onDownload={() => {}} projectName={state.projectName} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                <CodeEditor files={state.files} activeFile={state.activeFile} openFiles={state.openFiles} onSelectFile={openFile} onCloseFile={closeFile} onFileChange={updateFileContent} />
              </div>
            </div>
          )}

          {stripPanel === "preview" && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex items-center gap-2 px-3 h-9 border-b border-border bg-background/95 shrink-0">
                <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-semibold flex-1 truncate">/Home page</span>
                <button type="button" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Open in new tab">
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => sendMessage("Update and improve the current project")} disabled={state.isGenerating} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Refresh">
                  <RefreshCw className={cn("w-3.5 h-3.5", state.isGenerating && "animate-spin")} />
                </button>
                <button type="button" onClick={() => setShowCommandPalette(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-1" aria-label="Edit">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <LivePreview files={state.files} isGenerating={state.isGenerating} framework={state.framework} />
              </div>
            </div>
          )}

          {stripPanel === "requirements" && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex items-center gap-2 px-3 h-9 border-b border-border bg-background/95 shrink-0">
                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-semibold">Requirements</span>
                <span className="text-[10px] text-muted-foreground ml-1 hidden sm:inline">— project specs &amp; instructions</span>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <RequirementsPanel output={state.requirementsOutput} isGenerating={state.isGenerating} />
              </div>
            </div>
          )}

          {stripPanel === "code" && (
            <div className="flex flex-1 min-h-0 overflow-hidden">
              <div className="w-48 shrink-0 border-r border-border overflow-hidden flex flex-col">
                <FileExplorer files={state.files} activeFile={state.activeFile} onSelectFile={openFile} onReset={resetProject} onDownload={() => {}} projectName={state.projectName} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                <CodeEditor files={state.files} activeFile={state.activeFile} openFiles={state.openFiles} onSelectFile={openFile} onCloseFile={closeFile} onFileChange={updateFileContent} />
                {showTerminal && (
                  <div className="h-44 border-t border-border shrink-0">
                    <TerminalPanel files={state.files} projectName={state.projectName} />
                  </div>
                )}
              </div>
            </div>
          )}

          {stripPanel === "backend" && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex items-center gap-2 px-3 h-9 border-b border-border bg-background/95 shrink-0">
                <Database className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-semibold">Backend</span>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <BackendPanel output={state.backendOutput} isGenerating={state.isGenerating} />
              </div>
            </div>
          )}
        </div>

        {/* Right: AI Chat */}
        <div className="hidden md:flex flex-col shrink-0 border-l border-border bg-background" style={{ width: 380 }}>
          <div className="flex items-center gap-2 px-3 h-9 border-b border-border shrink-0">
            <Bot className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-semibold flex-1 min-w-0 truncate">
              {state.isGenerating ? (
                <span className="flex items-center gap-1.5 text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                  Building…
                </span>
              ) : "Agent Chat"}
            </span>
            <Button variant="ghost" size="sm" className="h-6 px-2 gap-1 text-[10px] text-muted-foreground hover:text-foreground shrink-0" onClick={() => resetProject()}>
              <Plus className="w-3 h-3" />
              New
            </Button>
          </div>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <AIChatPanel
              messages={state.messages}
              isGenerating={state.isGenerating}
              onSendMessage={sendMessage}
              onCancel={cancelGeneration}
              tokenBalance={tokenBalance}
              onPublish={() => setShowDeploy(true)}
            />
          </div>
        </div>

        {/* Mobile chat */}
        <div className="md:hidden fixed bottom-12 left-0 right-0 h-56 border-t border-border bg-background z-30 flex flex-col">
          <AIChatPanel
            messages={state.messages}
            isGenerating={state.isGenerating}
            onSendMessage={sendMessage}
            onCancel={cancelGeneration}
            tokenBalance={tokenBalance}
            onPublish={() => setShowDeploy(true)}
          />
        </div>
      </div>

      {/* Mobile bottom strip */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 flex border-t border-border bg-background z-40 h-12">
        {stripItems.slice(0, 4).map(({ id, icon: Icon }) => {
          const mobileLabel: Record<string, string> = {
            files: "Files",
            preview: "Preview",
            requirements: "Specs",
            code: "Editor",
            backend: "Backend",
          };
          return (
            <button key={id} type="button"
              className={cn(
                "flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium px-1",
                stripPanel === id ? "text-primary" : "text-muted-foreground"
              )}
              onClick={() => selectStrip(id)}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate w-full text-center leading-none">{mobileLabel[id]}</span>
            </button>
          );
        })}
      </div>

      {/* Tool dialogs */}
      <CommandPalette
        open={showCommandPalette} onClose={() => setShowCommandPalette(false)}
        onDownloadZip={() => setShowDeploy(true)} onSaveVersion={handleSaveVersion}
        onReset={resetProject} onOpenSearch={() => setShowSearchReplace(true)}
        onOpenPlugins={() => setShowPlugins(true)} onOpenVersionHistory={() => setShowVersionHistory(true)}
        onOpenTerminal={() => setShowTerminal(v => !v)} onOpenSettings={() => navigate("/subscription")}
        onNavigateDashboard={() => navigate("/dashboard")}
        onSignOut={async () => { await signOut(); navigate("/"); }}
        onDeployVercel={() => setShowDeploy(true)} onExportGitHub={() => setShowDeploy(true)}
      />
      <SearchReplace open={showSearchReplace} onClose={() => setShowSearchReplace(false)} files={state.files} onReplaceInFile={updateFileContent} onOpenFile={openFile} />
      <PluginRegistry open={showPlugins} onClose={() => setShowPlugins(false)} enabledPlugins={state.enabledPlugins} onToggle={togglePlugin} />
      <VersionHistory open={showVersionHistory} onClose={() => setShowVersionHistory(false)} projectId={state.projectId} currentFiles={state.files} onRestore={handleRestoreVersion} />
      <DeployPublish open={showDeploy} onClose={() => setShowDeploy(false)} files={state.files} projectName={state.projectName} isPaidUser={tokenBalance > 0} projectId={projectId} framework={state.framework} />
    </div>
  );
}
