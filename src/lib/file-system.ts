import type { FileNode, VirtualFileSystem } from "@/types/types";

// Get the language identifier for Monaco from file extension
export function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const langMap: Record<string, string> = {
    tsx: "typescriptreact",
    ts: "typescript",
    jsx: "javascript",
    js: "javascript",
    css: "css",
    scss: "scss",
    html: "html",
    json: "json",
    md: "markdown",
    mdx: "markdown",
    py: "python",
    sh: "shell",
    yml: "yaml",
    yaml: "yaml",
    env: "plaintext",
    gitignore: "plaintext",
  };
  return langMap[ext] ?? "plaintext";
}

// Get file icon class name based on extension
export function getFileIcon(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const iconMap: Record<string, string> = {
    tsx: "text-chart-1",
    ts: "text-info",
    jsx: "text-warning",
    js: "text-warning",
    css: "text-chart-2",
    scss: "text-chart-2",
    html: "text-destructive",
    json: "text-chart-4",
    md: "text-muted-foreground",
    mdx: "text-muted-foreground",
    svg: "text-chart-3",
    png: "text-chart-3",
    jpg: "text-chart-3",
    env: "text-chart-5",
    gitignore: "text-muted-foreground",
  };
  return iconMap[ext] ?? "text-muted-foreground";
}

// Build a tree structure from flat file paths
export function buildFileTree(files: VirtualFileSystem): FileNode[] {
  const root: Record<string, FileNode> = {};

  // Sort paths for consistent ordering (folders first, then alphabetical)
  const paths = Object.keys(files).sort((a, b) => {
    const aDepth = (a.match(/\//g) ?? []).length;
    const bDepth = (b.match(/\//g) ?? []).length;
    if (aDepth !== bDepth) return bDepth - aDepth;
    return a.localeCompare(b);
  });

  for (const filePath of paths) {
    const normalizedPath = filePath.startsWith("/")
      ? filePath.slice(1)
      : filePath;
    const parts = normalizedPath.split("/");

    let currentPath = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = i === parts.length - 1;

      if (!root[currentPath]) {
        root[currentPath] = {
          name: part,
          path: "/" + currentPath,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
          language: isFile ? getLanguageFromPath(part) : undefined,
        };
      }

      if (parentPath && root[parentPath]?.children) {
        const parent = root[parentPath];
        if (
          parent.children &&
          !parent.children.some((c) => c.path === "/" + currentPath)
        ) {
          parent.children.push(root[currentPath]);
        }
      }
    }
  }

  // Return top-level nodes (no parent)
  return Object.values(root)
    .filter((node) => {
      const normalizedPath = node.path.startsWith("/")
        ? node.path.slice(1)
        : node.path;
      return !normalizedPath.includes("/");
    })
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

// Get the default/active file from a virtual filesystem
export function getDefaultFile(files: VirtualFileSystem): string | null {
  const priority = [
    "/App.tsx",
    "/app/page.tsx",
    "/pages/index.tsx",
    "/src/App.tsx",
    "/index.tsx",
  ];
  for (const p of priority) {
    if (files[p]) return p;
  }
  const keys = Object.keys(files);
  return keys.find((k) => k.endsWith(".tsx")) ?? keys[0] ?? null;
}

// Default starter project files
export const DEFAULT_PROJECT_FILES: VirtualFileSystem = {
  "/App.tsx": `import React from 'react';

export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        textAlign: 'center',
        color: 'white',
        padding: '2rem',
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 700 }}>
          ✨ Welcome to SiteGenie
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '2rem' }}>
          Describe your app in the chat to get started
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '12px',
          padding: '1.5rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
            💡 Try: "Build a SaaS landing page" or "Create a dashboard"
          </p>
        </div>
      </div>
    </div>
  );
}
`,
};
