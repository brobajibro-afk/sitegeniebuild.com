import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  GitBranch,
  RotateCcw,
  Loader2,
  Clock,
  Folder,
  GitCommit,
} from "lucide-react";
import { supabase } from "@/db/supabase";
import type { ProjectVersion, VirtualFileSystem } from "@/types/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VersionHistoryProps {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
  currentFiles: VirtualFileSystem;
  onRestore: (files: VirtualFileSystem) => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function VersionHistory({
  open,
  onClose,
  projectId,
  currentFiles,
  onRestore,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoreId, setRestoreId] = useState<string | null>(null);

  const loadVersions = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("project_versions")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) toast.error("Failed to load versions");
    else setVersions(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (open) loadVersions();
  }, [open, loadVersions]);

  const doRestore = (version: ProjectVersion) => {
    const files = version.files as VirtualFileSystem;
    onRestore(files);
    onClose();
    toast.success(`Restored to: ${version.message}`);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] flex flex-col overflow-hidden gap-0 p-0">
          <DialogHeader className="px-4 py-3 border-b border-border shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <GitBranch className="w-4 h-4 text-primary" />
              Version History
            </DialogTitle>
          </DialogHeader>

          {/* Current state */}
          <div className="px-4 py-3 border-b border-border/50 bg-primary/5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <GitCommit className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">Current (unsaved)</p>
                <p className="text-[10px] text-muted-foreground">
                  {Object.keys(currentFiles).length} files
                </p>
              </div>
              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                HEAD
              </span>
            </div>
          </div>

          {/* Versions list */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <GitBranch className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No versions saved yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Versions are saved automatically after each generation
                </p>
              </div>
            ) : (
              <div className="py-1">
                {versions.map((version, i) => {
                  const files = version.files as VirtualFileSystem;
                  const fileCount = Object.keys(files).length;
                  return (
                    <div
                      key={version.id}
                      className="flex items-start gap-2.5 px-4 py-3 hover:bg-accent/30 transition-colors group"
                    >
                      {/* Timeline */}
                      <div className="flex flex-col items-center shrink-0 mt-1">
                        <div className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                        </div>
                        {i < versions.length - 1 && (
                          <div className="w-px flex-1 bg-border/50 mt-1 min-h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pb-3">
                        <p className="text-xs font-medium text-foreground truncate">
                          {version.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {timeAgo(version.created_at)}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Folder className="w-2.5 h-2.5" />
                            {fileCount} files
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-7 px-2.5 text-xs gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                          "border border-border/60 text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setRestoreId(version.id)}
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Restore confirmation */}
      <AlertDialog open={!!restoreId} onOpenChange={() => setRestoreId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this version?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current unsaved changes will be replaced with this version. Consider saving first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-primary-foreground"
              onClick={() => {
                const v = versions.find((ver) => ver.id === restoreId);
                if (v) doRestore(v);
                setRestoreId(null);
              }}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
