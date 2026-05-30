import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Replace, ChevronDown, ChevronUp, X, FileText } from "lucide-react";
import type { SearchResult, VirtualFileSystem } from "@/types/types";
import { cn } from "@/lib/utils";

interface SearchReplaceProps {
  open: boolean;
  onClose: () => void;
  files: VirtualFileSystem;
  onReplaceInFile: (filePath: string, newContent: string) => void;
  onOpenFile: (filePath: string) => void;
}

export function SearchReplace({
  open,
  onClose,
  files,
  onReplaceInFile,
  onOpenFile,
}: SearchReplaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const doSearch = useCallback(() => {
    if (!searchQuery.trim()) { setResults([]); return; }
    setHasSearched(true);

    const found: SearchResult[] = [];
    const query = caseSensitive ? searchQuery : searchQuery.toLowerCase();

    for (const [filePath, content] of Object.entries(files)) {
      const lines = content.split("\n");
      lines.forEach((lineContent, i) => {
        const lineToSearch = caseSensitive ? lineContent : lineContent.toLowerCase();
        let idx = lineToSearch.indexOf(query);
        while (idx !== -1) {
          found.push({
            filePath,
            lineNumber: i + 1,
            lineContent,
            matchStart: idx,
            matchEnd: idx + query.length,
          });
          idx = lineToSearch.indexOf(query, idx + 1);
          if (found.length > 500) break;
        }
        if (found.length > 500) return;
      });
    }

    setResults(found);
  }, [searchQuery, files, caseSensitive]);

  const doReplaceAll = useCallback(() => {
    if (!searchQuery.trim()) return;
    const flags = caseSensitive ? "g" : "gi";
    const pattern = useRegex ? new RegExp(searchQuery, flags) : new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);

    let replacedCount = 0;
    for (const [filePath, content] of Object.entries(files)) {
      const newContent = content.replace(pattern, replaceQuery);
      if (newContent !== content) {
        onReplaceInFile(filePath, newContent);
        replacedCount++;
      }
    }

    if (replacedCount > 0) {
      doSearch();
    }
  }, [searchQuery, replaceQuery, files, caseSensitive, useRegex, onReplaceInFile, doSearch]);

  const doReplaceOne = useCallback((result: SearchResult) => {
    const content = files[result.filePath];
    if (!content) return;
    const flags = caseSensitive ? "" : "i";
    const pattern = useRegex
      ? new RegExp(searchQuery, flags)
      : new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
    const newContent = content.replace(pattern, replaceQuery);
    onReplaceInFile(result.filePath, newContent);
    doSearch();
  }, [files, searchQuery, replaceQuery, caseSensitive, useRegex, onReplaceInFile, doSearch]);

  // Group results by file
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.filePath]) acc[r.filePath] = [];
    acc[r.filePath].push(r);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Search className="w-4 h-4 text-primary" />
            Search & Replace
          </DialogTitle>
        </DialogHeader>

        {/* Search controls */}
        <div className="px-4 py-3 border-b border-border space-y-3 shrink-0">
          {/* Search input */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => setShowReplace((v) => !v)}
            >
              {showReplace ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setHasSearched(false); }}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder="Search..."
                className="pl-8 h-8 text-sm bg-muted/50 border-border/60"
                autoFocus
              />
            </div>
            <Button
              size="sm"
              className="h-8 px-3 text-xs bg-primary text-primary-foreground shrink-0"
              onClick={doSearch}
            >
              Search
            </Button>
          </div>

          {/* Replace input */}
          {showReplace && (
            <div className="flex items-center gap-2 pl-6">
              <div className="flex-1 relative">
                <Replace className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  placeholder="Replace with..."
                  className="pl-8 h-8 text-sm bg-muted/50 border-border/60"
                />
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3 text-xs border border-border/60 shrink-0"
                onClick={doReplaceAll}
                disabled={!searchQuery.trim()}
              >
                Replace All
              </Button>
            </div>
          )}

          {/* Options */}
          <div className="flex items-center gap-4 pl-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="case-sensitive"
                checked={caseSensitive}
                onCheckedChange={(v) => setCaseSensitive(!!v)}
                className="h-3.5 w-3.5"
              />
              <Label htmlFor="case-sensitive" className="text-xs cursor-pointer text-muted-foreground">
                Case sensitive
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="use-regex"
                checked={useRegex}
                onCheckedChange={(v) => setUseRegex(!!v)}
                className="h-3.5 w-3.5"
              />
              <Label htmlFor="use-regex" className="text-xs cursor-pointer text-muted-foreground">
                Use regex
              </Label>
            </div>
            {hasSearched && (
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {results.length} match{results.length !== 1 ? "es" : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {hasSearched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <X className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No results found</p>
            </div>
          )}

          {Object.entries(groupedResults).map(([filePath, fileResults]) => (
            <div key={filePath} className="border-b border-border/40 last:border-0">
              <button
                type="button"
                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-accent/30 transition-colors"
                onClick={() => onOpenFile(filePath)}
              >
                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium text-foreground/80 truncate flex-1 text-left">{filePath}</span>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {fileResults.length}
                </Badge>
              </button>

              {fileResults.slice(0, 10).map((result, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 px-4 py-1.5 hover:bg-accent/20 transition-colors group"
                >
                  <span className="text-[10px] text-muted-foreground/50 font-mono w-8 shrink-0 text-right mt-0.5">
                    {result.lineNumber}
                  </span>
                  <code className="text-xs text-foreground/70 flex-1 font-mono truncate min-w-0">
                    <span>{result.lineContent.slice(0, result.matchStart)}</span>
                    <mark className="bg-primary/30 text-primary rounded-sm px-0.5 not-italic">
                      {result.lineContent.slice(result.matchStart, result.matchEnd)}
                    </mark>
                    <span>{result.lineContent.slice(result.matchEnd)}</span>
                  </code>
                  {showReplace && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => doReplaceOne(result)}
                    >
                      Replace
                    </Button>
                  )}
                </div>
              ))}

              {fileResults.length > 10 && (
                <div className="px-4 py-1.5 text-[10px] text-muted-foreground/60">
                  +{fileResults.length - 10} more matches in this file
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
