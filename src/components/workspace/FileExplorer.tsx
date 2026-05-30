import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  RefreshCw,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { buildFileTree, getFileIcon } from "@/lib/file-system";
import type { FileNode, VirtualFileSystem } from "@/types/types";
import { cn } from "@/lib/utils";

interface FileExplorerProps {
  files: VirtualFileSystem;
  activeFile: string | null;
  onSelectFile: (path: string) => void;
  onReset: () => void;
  onDownload: () => void;
  projectName?: string;
}

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
  activeFile: string | null;
  onSelectFile: (path: string) => void;
}

function FileTreeNode({
  node,
  depth,
  activeFile,
  onSelectFile,
}: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const isActive = node.path === activeFile;
  const isFolder = node.type === "folder";
  const iconColor = getFileIcon(node.name);

  const indent = depth * 12;

  const handleClick = () => {
    if (isFolder) {
      setExpanded((e) => !e);
    } else {
      onSelectFile(node.path);
    }
  };

  return (
    <div>
      <button
        type="button"
        className={cn(
          "w-full flex items-center gap-1.5 py-[3px] px-2 rounded text-xs transition-colors group",
          "hover:bg-sidebar-accent text-sidebar-foreground",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary"
        )}
        style={{ paddingLeft: `${8 + indent}px` }}
        onClick={handleClick}
      >
        {isFolder ? (
          <>
            <span className="text-muted-foreground flex-shrink-0">
              {expanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </span>
            {expanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-chart-4 flex-shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-chart-4 flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3 flex-shrink-0" />
            <File className={cn("w-3.5 h-3.5 flex-shrink-0", iconColor)} />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>

      {isFolder && expanded && node.children && (
        <div>
          {node.children
            .sort((a, b) => {
              if (a.type !== b.type)
                return a.type === "folder" ? -1 : 1;
              return a.name.localeCompare(b.name);
            })
            .map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                activeFile={activeFile}
                onSelectFile={onSelectFile}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({
  files,
  activeFile,
  onSelectFile,
  onReset,
  onDownload,
  projectName = "my-app",
}: FileExplorerProps) {
  const fileTree = buildFileTree(files);
  const fileCount = Object.keys(files).length;

  return (
    <div className="flex flex-col h-full bg-sidebar select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Folder className="w-3.5 h-3.5 text-chart-4 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 truncate">
            {projectName}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={onDownload}
                >
                  <Download className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Download project</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={onReset}
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Reset project</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* File count */}
      <div className="px-3 py-1.5 border-b border-sidebar-border shrink-0">
        <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-widest font-medium">
          {fileCount} {fileCount === 1 ? "file" : "files"}
        </p>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-1.5 min-h-0">
        {fileTree.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <Plus className="w-5 h-5 text-sidebar-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-sidebar-foreground/40">
              No files yet.
              <br />
              Generate a project to start.
            </p>
          </div>
        ) : (
          fileTree.map((node) => (
            <FileTreeNode
              key={node.path}
              node={node}
              depth={0}
              activeFile={activeFile}
              onSelectFile={onSelectFile}
            />
          ))
        )}
      </div>
    </div>
  );
}
