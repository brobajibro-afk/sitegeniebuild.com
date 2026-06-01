import React, { useRef, useEffect, useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Square,
  Sparkles,
  User,
  ChevronRight,
  Paperclip,
  X,
  FileText,
  Image,
  FileCode,
  Coins,
  Rocket,
} from "lucide-react";
import type { ChatMessage } from "@/types/types";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

const EXAMPLE_PROMPTS = [
  "Build a SaaS landing page with pricing",
  "Create a restaurant website with menu",
  "Make a portfolio with dark theme",
  "Build a task management dashboard",
];

// Allowed file types for upload / analysis
const ACCEPTED_TYPES = [
  "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml",
  "text/plain", "text/html", "text/css", "text/javascript",
  "application/json", "application/pdf",
  "text/x-typescript", "text/typescript",
  ".tsx", ".ts", ".jsx", ".js", ".css", ".html", ".txt", ".json", ".md",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string; // text content for analysis
  dataUrl?: string; // for images
}

interface AIChatPanelProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  onSendMessage: (message: string, files?: UploadedFile[], model?: string) => void;
  onCancel: () => void;
  tokenBalance?: number;
  onPublish?: () => void;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type.includes("javascript") || type.includes("typescript") || type.includes("html") || type.includes("css"))
    return FileCode;
  return FileText;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-2.5 animate-fade-in", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
        isUser ? "bg-primary/20" : "bg-muted"
      )}>
        {isUser ? <User className="w-3.5 h-3.5 text-primary" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
      </div>
      <div className={cn(
        "max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed",
        isUser
          ? "bg-primary/15 text-foreground border border-primary/20"
          : "bg-secondary text-foreground border border-border/40"
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="prose-sm prose-invert max-w-none break-words [&_pre]:bg-muted [&_pre]:rounded [&_pre]:p-2 [&_code]:text-primary [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5">
            {message.isStreaming ? (
              <Streamdown parseIncompleteMarkdown isAnimating={true}>{message.content}</Streamdown>
            ) : (
              <Streamdown parseIncompleteMarkdown isAnimating={false}>{message.content}</Streamdown>
            )}
          </div>
        )}
        {message.isStreaming && (
          <span className="inline-block w-1.5 h-3.5 bg-primary rounded-sm ml-0.5 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}

export function AIChatPanel({
  messages,
  isGenerating,
  onSendMessage,
  onCancel,
  tokenBalance = 0,
  onPublish,
}: AIChatPanelProps) {
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedModel, setSelectedModel] = useState("claude-sonnet-4-20250514");
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── File handling ──
  const readFile = (file: File): Promise<UploadedFile> =>
    new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const isImage = file.type.startsWith("image/");
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve({
          id,
          name: file.name,
          type: file.type || "text/plain",
          size: file.size,
          content: isImage ? undefined : result,
          dataUrl: isImage ? result : undefined,
        });
      };
      reader.onerror = reject;

      if (isImage) reader.readAsDataURL(file);
      else reader.readAsText(file);
    });

  const processFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const valid = arr.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    if (valid.length === 0) return;

    try {
      const processed = await Promise.all(valid.map(readFile));
      setUploadedFiles((prev) => [...prev, ...processed]);
      toast.success(`${processed.length} file${processed.length > 1 ? "s" : ""} attached for analysis`);
    } catch {
      toast.error("Failed to read file");
    }
  };

  const removeFile = (id: string) => setUploadedFiles((prev) => prev.filter((f) => f.id !== id));

  // ── Drag & drop on the whole panel ──
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  };

  // ── Send ──
  const handleSend = () => {
    if ((!input.trim() && uploadedFiles.length === 0) || isGenerating) return;

    let message = input.trim();

    // Append file context to the prompt
    if (uploadedFiles.length > 0) {
      const fileContext = uploadedFiles
        .map((f) => {
          if (f.dataUrl) return `[Attached image: ${f.name}]`;
          return `[File: ${f.name}]\n\`\`\`\n${(f.content ?? "").slice(0, 4000)}\n\`\`\``;
        })
        .join("\n\n");
      message = message
        ? `${message}\n\n${fileContext}`
        : `Analyze the following files and help me build based on them:\n\n${fileContext}`;
    }

    onSendMessage(message, uploadedFiles, selectedModel);
    setInput("");
    setUploadedFiles([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const hasNoMessages = messages.length <= 1;

  return (
    <div
      className={cn(
        "flex flex-col flex-1 min-h-0 bg-editor-panel border-r border-editor-border relative transition-colors",
        isDragging && "bg-primary/5 border-primary/30"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center border-2 border-dashed border-primary/50 rounded-lg bg-primary/5 pointer-events-none">
          <Paperclip className="w-8 h-8 text-primary/60 mb-2" />
          <p className="text-sm font-medium text-primary">Drop files to attach</p>
          <p className="text-xs text-muted-foreground">Images, code, JSON, PDF — max 5MB each</p>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-editor-border shrink-0">
        <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground leading-tight">SiteGenie AI</p>
          <p className="text-[10px] text-muted-foreground leading-tight">
            {isGenerating ? "Generating…" : "Ready"}
          </p>
        </div>

        {/* Model selector */}
        <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="h-6 px-1 rounded border border-border bg-background text-[11px] text-foreground shrink-0 max-w-[110px]" disabled={isGenerating}>
          <option value="claude-sonnet-4-20250514">Claude Sonnet</option>
          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          <option value="gpt-4o">GPT-4o</option>
          <option value="deepseek-chat">DeepSeek</option>
          <option value="grok-3-mini">Grok 3 Mini</option>
        </select>

        {/* Token balance badge */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 shrink-0">
          <Coins className="w-3 h-3 text-primary" />
          <span className="text-[11px] font-semibold text-primary">{tokenBalance.toLocaleString()}</span>
        </div>

        {/* Publish button */}
        {onPublish && (
          <Button
            size="sm"
            className="h-7 px-2.5 gap-1.5 text-[11px] bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            onClick={onPublish}
          >
            <Rocket className="w-3 h-3" />
            <span className="hidden sm:inline">Publish</span>
          </Button>
        )}

        {/* Generating pulse */}
        {isGenerating && (
          <div className="w-2 h-2 rounded-full bg-primary ai-pulse shrink-0" />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-scroll p-3 space-y-4 min-h-0 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60 [&::-webkit-scrollbar-track]:bg-muted/30">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Example prompts */}
      {!isGenerating && hasNoMessages && (
        <div className="px-3 pb-2 shrink-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-1.5">
            Try an example
          </p>
          <div className="space-y-1">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group"
                onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
              >
                <ChevronRight className="w-3 h-3 shrink-0 group-hover:text-primary" />
                <span className="truncate">{prompt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input area ── */}
      <div className="p-3 pb-4 border-t border-editor-border shrink-0 space-y-2">

        {/* Attached files preview */}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {uploadedFiles.map((file) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg bg-primary/10 border border-primary/20 max-w-full"
                >
                  {file.dataUrl ? (
                    <img src={file.dataUrl} alt={file.name} className="w-4 h-4 rounded object-cover shrink-0" />
                  ) : (
                    <FileIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                  <span className="text-[11px] text-foreground truncate max-w-[100px]">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="w-4 h-4 rounded flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Textarea + actions */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isDragging
                ? "Drop files here…"
                : isGenerating
                  ? "Generating your app…"
                  : uploadedFiles.length > 0
                    ? "Describe what to build with these files…"
                    : "Describe your app… (Enter to send)"
            }
            disabled={isGenerating}
            rows={3}
            className="resize-none bg-input border-border text-foreground placeholder:text-muted-foreground pr-10 pb-9 text-sm leading-relaxed"
          />

          {/* Bottom-left: attach button */}
          <div className="absolute left-2 bottom-2 flex items-center gap-1">
            <button
              type="button"
              title="Attach files for analysis (images, code, JSON, PDF)"
              className={cn(
                "flex items-center gap-1 h-6 px-2 rounded text-[11px] transition-colors",
                uploadedFiles.length > 0
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attach</span>
              {uploadedFiles.length > 0 && (
                <Badge className="h-4 px-1 text-[9px] bg-primary text-primary-foreground ml-0.5">
                  {uploadedFiles.length}
                </Badge>
              )}
            </button>
          </div>

          {/* Bottom-right: send/stop button */}
          <div className="absolute right-2 bottom-2">
            {isGenerating ? (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                onClick={onCancel}
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="h-7 w-7 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30"
                onClick={handleSend}
                disabled={!input.trim() && uploadedFiles.length === 0}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.txt,.html,.css,.js,.ts,.jsx,.tsx,.json,.md,.pdf"
          className="hidden"
          onChange={(e) => { if (e.target.files) processFiles(e.target.files); e.target.value = ""; }}
        />

        <p className="text-[10px] text-muted-foreground text-center">
          {isGenerating ? "Click ■ to cancel" : "⏎ Send • ⇧⏎ New line • Drag & drop files"}
        </p>
      </div>
    </div>
  );
}
