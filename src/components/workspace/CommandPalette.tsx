import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Search,
  Sparkles,
  Download,
  RefreshCw,
  Github,
  Globe,
  Terminal,
  Settings,
  Save,
  GitBranch,
  Keyboard,
  Puzzle,
  FileSearch,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon: React.ElementType;
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onDownloadZip: () => void;
  onSaveVersion: () => void;
  onReset: () => void;
  onOpenSearch: () => void;
  onOpenPlugins: () => void;
  onOpenVersionHistory: () => void;
  onOpenTerminal: () => void;
  onOpenSettings: () => void;
  onNavigateDashboard: () => void;
  onSignOut: () => void;
  onDeployVercel: () => void;
  onExportGitHub: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onDownloadZip,
  onSaveVersion,
  onReset,
  onOpenSearch,
  onOpenPlugins,
  onOpenVersionHistory,
  onOpenTerminal,
  onOpenSettings,
  onNavigateDashboard,
  onSignOut,
  onDeployVercel,
  onExportGitHub,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allCommands: CommandItem[] = [
    {
      id: "save-version",
      label: "Save Version",
      description: "Create a snapshot of the current project",
      shortcut: "⌘S",
      icon: Save,
      category: "Project",
      action: () => { onClose(); onSaveVersion(); },
    },
    {
      id: "search-replace",
      label: "Search & Replace",
      description: "Search across all files",
      shortcut: "⌘F",
      icon: FileSearch,
      category: "Edit",
      action: () => { onClose(); onOpenSearch(); },
    },
    {
      id: "plugins",
      label: "Plugin Registry",
      description: "Browse and install plugins",
      shortcut: "⌘P",
      icon: Puzzle,
      category: "Tools",
      action: () => { onClose(); onOpenPlugins(); },
    },
    {
      id: "version-history",
      label: "Version History",
      description: "Browse and restore previous versions",
      shortcut: "⌘H",
      icon: GitBranch,
      category: "Project",
      action: () => { onClose(); onOpenVersionHistory(); },
    },
    {
      id: "download-zip",
      label: "Download as ZIP",
      description: "Export all project files as a ZIP archive",
      shortcut: "⌘D",
      icon: Download,
      category: "Export",
      action: () => { onClose(); onDownloadZip(); },
    },
    {
      id: "deploy-vercel",
      label: "Deploy to Vercel",
      description: "Publish your app with one click",
      icon: Globe,
      category: "Deploy",
      action: () => { onClose(); onDeployVercel(); },
    },
    {
      id: "export-github",
      label: "Export to GitHub",
      description: "Push project to a new GitHub repository",
      icon: Github,
      category: "Export",
      action: () => { onClose(); onExportGitHub(); },
    },
    {
      id: "terminal",
      label: "Toggle Terminal",
      description: "Show or hide the integrated terminal",
      shortcut: "⌘`",
      icon: Terminal,
      category: "View",
      action: () => { onClose(); onOpenTerminal(); },
    },
    {
      id: "settings",
      label: "Settings",
      description: "Open editor and account settings",
      shortcut: "⌘,",
      icon: Settings,
      category: "Preferences",
      action: () => { onClose(); onOpenSettings(); },
    },
    {
      id: "reset",
      label: "Reset Project",
      description: "Clear all files and start fresh",
      icon: RefreshCw,
      category: "Project",
      action: () => { onClose(); onReset(); },
    },
    {
      id: "dashboard",
      label: "Go to Dashboard",
      description: "Return to your project list",
      icon: LayoutDashboard,
      category: "Navigation",
      action: () => { onClose(); onNavigateDashboard(); },
    },
    {
      id: "signout",
      label: "Sign Out",
      description: "Sign out of your account",
      icon: LogOut,
      category: "Account",
      action: () => { onClose(); onSignOut(); },
    },
  ];

  const filtered = query.trim()
    ? allCommands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands;

  // Group by category
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  // Flat list for keyboard nav
  const flatList = Object.values(grouped).flat();

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      flatList[selectedIndex]?.action();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  let flatIndex = 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg p-0 overflow-hidden gap-0">
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            className="border-0 bg-transparent h-8 px-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-primary font-medium">SiteGenie</span>
            </div>
          </div>
        </div>

        {/* Commands */}
        <div className="max-h-[400px] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No commands found
            </div>
          ) : (
            Object.entries(grouped).map(([category, cmds]) => (
              <div key={category}>
                <div className="px-4 py-1.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                  {category}
                </div>
                {cmds.map((cmd) => {
                  const isSelected = flatIndex === selectedIndex;
                  const currentIndex = flatIndex++;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                      )}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                    >
                      <cmd.icon className={cn(
                        "w-4 h-4 shrink-0",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-xs text-muted-foreground truncate">{cmd.description}</div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className="text-[10px] bg-muted border border-border px-1.5 py-0.5 rounded font-mono shrink-0">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>↑↓ Navigate</span>
          <span>↵ Execute</span>
          <span>Esc Close</span>
          <span className="ml-auto flex items-center gap-1">
            <kbd className="bg-muted border border-border px-1 py-0.5 rounded font-mono">⌘K</kbd>
            to open
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
