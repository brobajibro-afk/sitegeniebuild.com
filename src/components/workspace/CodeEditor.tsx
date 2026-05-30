import React, { useCallback } from "react";
import MonacoEditor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { X, Code2, AlertCircle } from "lucide-react";
import { getLanguageFromPath, getFileIcon } from "@/lib/file-system";
import type { VirtualFileSystem } from "@/types/types";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  files: VirtualFileSystem;
  activeFile: string | null;
  openFiles: string[];
  onFileChange: (path: string, content: string) => void;
  onSelectFile: (path: string) => void;
  onCloseFile: (path: string) => void;
}

function TabItem({
  filePath,
  isActive,
  onSelect,
  onClose,
}: {
  filePath: string;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  const fileName = filePath.split("/").pop() ?? filePath;
  const iconColor = getFileIcon(fileName);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 border-r border-editor-border cursor-pointer group shrink-0 relative",
        "text-xs transition-colors",
        isActive
          ? "bg-editor-bg text-foreground border-b-2 border-b-primary"
          : "bg-editor-tab-inactive text-muted-foreground hover:text-foreground hover:bg-editor-bg/60"
      )}
      onClick={onSelect}
    >
      <span className={cn("w-3 h-3 rounded-sm flex-shrink-0", iconColor)}>
        <Code2 className="w-3 h-3" />
      </span>
      <span className="max-w-[100px] truncate">{fileName}</span>
      <button
        type="button"
        className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-muted transition-all flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

export function CodeEditor({
  files,
  activeFile,
  openFiles,
  onFileChange,
  onSelectFile,
  onCloseFile,
}: CodeEditorProps) {
  const fileContent = activeFile ? (files[activeFile] ?? "") : "";
  const language = activeFile ? getLanguageFromPath(activeFile) : "typescript";

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeFile && value !== undefined) {
        onFileChange(activeFile, value);
      }
    },
    [activeFile, onFileChange]
  );

  const handleEditorMount = (_editor: unknown, monaco: unknown) => {
    // Configure TypeScript compiler options
    const m = monaco as {
      languages: {
        typescript: {
          typescriptDefaults: {
            setCompilerOptions: (opts: Record<string, unknown>) => void;
            setDiagnosticsOptions: (opts: Record<string, unknown>) => void;
          };
          javascriptDefaults: {
            setCompilerOptions: (opts: Record<string, unknown>) => void;
          };
        };
      };
    };

    m.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: 99, // ESNext
      allowNonTsExtensions: true,
      moduleResolution: 2, // Node
      module: 99, // ESNext
      noEmit: true,
      esModuleInterop: true,
      jsx: 1, // Preserve
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    });

    m.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
  };

  if (openFiles.length === 0) {
    return (
      <div className="flex flex-col h-full bg-editor-bg items-center justify-center">
        <Code2 className="w-12 h-12 text-muted-foreground/20 mb-3" />
        <p className="text-sm text-muted-foreground/50">
          Select a file to edit
        </p>
        <p className="text-xs text-muted-foreground/30 mt-1">
          Or generate a project from chat
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-editor-bg">
      {/* Tab Bar */}
      <div className="flex items-center overflow-x-auto border-b border-editor-border bg-editor-tab-inactive shrink-0">
        {openFiles.map((filePath) => (
          <TabItem
            key={filePath}
            filePath={filePath}
            isActive={filePath === activeFile}
            onSelect={() => onSelectFile(filePath)}
            onClose={() => onCloseFile(filePath)}
          />
        ))}
      </div>

      {/* Breadcrumb / file path — avoid React.Fragment (can't accept data-* props from Fast Refresh) */}
      {activeFile && (
        <div className="flex items-center gap-1 px-3 py-1 border-b border-editor-border/50 bg-editor-bg/80 shrink-0">
          {activeFile
            .split("/")
            .filter(Boolean)
            .flatMap((segment, i, arr) => {
              const items = [
                <span
                  key={`seg-${i}`}
                  className={cn(
                    "text-[10px]",
                    i === arr.length - 1
                      ? "text-foreground/70"
                      : "text-muted-foreground/50"
                  )}
                >
                  {segment}
                </span>,
              ];
              if (i < arr.length - 1) {
                items.push(
                  <span key={`sep-${i}`} className="text-muted-foreground/30 text-[10px]">/</span>
                );
              }
              return items;
            })}
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        {activeFile && files[activeFile] !== undefined ? (
          <MonacoEditor
            height="100%"
            language={language}
            value={fileContent}
            theme="vs-dark"
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            options={{
              fontSize: 13,
              lineHeight: 1.6,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              lineNumbers: "on",
              glyphMargin: false,
              folding: true,
              renderLineHighlight: "line",
              renderWhitespace: "none",
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true },
              tabSize: 2,
              insertSpaces: true,
              formatOnPaste: true,
              suggest: { showKeywords: true },
              quickSuggestions: true,
              parameterHints: { enabled: true },
              scrollbar: {
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
              },
            }}
          />
        ) : (
          <div className="flex flex-col h-full items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground/40">File not found</p>
          </div>
        )}
      </div>

      {/* Status bar */}
      {activeFile && (
        <div className="flex items-center justify-between px-3 py-1 bg-primary/10 border-t border-editor-border shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              {language}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>UTF-8</span>
            <span>2 spaces</span>
          </div>
        </div>
      )}
    </div>
  );
}
