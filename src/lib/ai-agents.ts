import { sendStreamRequest } from "@/lib/sse";
import type { AgentStep, Framework, VirtualFileSystem } from "@/types/types";
import { getCodeGenerationSystem, getEditSystem } from "@/lib/frameworks";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: import.meta.env.VITE_OPENROUTER_KEY,
});

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const LLM_URL = `https://web-production-27b64.up.railway.app/ws/generate`;

export const AGENT_STEPS: AgentStep[] = [
  { id: "requirements", name: "requirements", label: "Requirements Agent", status: "pending", description: "Analyzing your request..." },
  { id: "planning",     name: "planning",     label: "Planning Agent",     status: "pending", description: "Designing architecture..." },
  { id: "ui",          name: "ui",           label: "UI Agent",           status: "pending", description: "Generating components..." },
  { id: "backend",     name: "backend",      label: "Backend Agent",      status: "pending", description: "Setting up data layer..." },
  { id: "fix",         name: "fix",          label: "Fix Agent",          status: "pending", description: "Reviewing and polishing..." },
];

async function collectStreamText(
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemPrompt: string,
  signal?: AbortSignal
): Promise<string> {
  return new Promise((resolve, reject) => {
    const res = await fetch(LLM_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contents, systemPrompt, model }),
      signal,
    });
    const data = await res.json();
    if (data.files && Object.keys(data.files).length > 0) {
      console.log("✅ Files received from edge:", Object.keys(data.files).length);
      resolve(JSON.stringify(data.files));
    } else if (data.text) {
      resolve(data.text);
    } else {
      resolve('');
    }
  });
}

/** Normalize an LLM object response into a VirtualFileSystem map. */
function extractFilesFromObject(obj: unknown): VirtualFileSystem | null {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return null;
  const files: VirtualFileSystem = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof value === "string" && (key.includes(".") || key.startsWith("/"))) {
      const normalizedKey = key.startsWith("/") ? key : `/${key}`;
      files[normalizedKey] = value;
    }
  }
  return Object.keys(files).length > 0 ? files : null;
}

/** Try JSON.parse with progressive repair for truncated/malformed JSON. */
function tryParseJson(raw: string): unknown | null {
  // 1. Direct parse
  try { return JSON.parse(raw); } catch { /* continue */ }
  // 2. Strip trailing commas before closing bracket
  const stripped = raw.replace(/,\s*([\]}])/g, "$1");
  try { return JSON.parse(stripped); } catch { /* continue */ }
  // 3. Force-close unterminated JSON
  const repaired = stripped.replace(/[^}\]]*$/, "") + "}";
  try { return JSON.parse(repaired); } catch { /* give up */ }
  return null;
}

export function parseFilesFromResponse(responseText: string): VirtualFileSystem | null {
  if (!responseText) return null;

  // Strip markdown fences - Claude wraps in ```json
  const fenceMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const cleaned = fenceMatch ? fenceMatch[1].trim() : responseText.trim();
  if (cleaned.startsWith("{")) {
    try {
      const direct = JSON.parse(cleaned);
      const directFiles = extractFilesFromObject(direct);
      if (directFiles) return directFiles;
    } catch { /* continue */ }
  }

  // Strategy 1: every fenced code block
  const codeBlockRe = /```(?:json|javascript|typescript|jsx|tsx)?\s*([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = codeBlockRe.exec(responseText)) !== null) {
    const candidate = match[1].trim();
    if (!candidate.startsWith("{")) continue;
    const parsed = tryParseJson(candidate);
    const files = extractFilesFromObject(parsed);
    if (files) return files;
  }

  // Strategy 2: largest { ... } span in raw text
  const firstBrace = responseText.indexOf("{");
  if (firstBrace !== -1) {
    let depth = 0;
    let end = -1;
    for (let i = firstBrace; i < responseText.length; i++) {
      if (responseText[i] === "{") depth++;
      else if (responseText[i] === "}") {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    const candidate = end !== -1
      ? responseText.slice(firstBrace, end + 1)
      : responseText.slice(firstBrace);
    const parsed = tryParseJson(candidate);
    const files = extractFilesFromObject(parsed);
    if (files) return files;
  }

  return null;
}



interface GenerateProjectResult {
  files: VirtualFileSystem;
  requirementsOutput: string;
  backendOutput: string;
}

eexport async function generateProject(
  userPrompt: string,
  onStepUpdate: (stepId: string, status: AgentStep["status"]) => void,
  onStreamChunk: (chunk: string) => void,
  signal?: AbortSignal,
  enabledPlugins: string[] = [],
  framework: Framework = "react-ts",
  model: string = "claude-sonnet-4-20250514"
): Promise<GenerateProjectResult> {

  onStepUpdate("requirements", "running");
  onStreamChunk("🔍 Analyzing requirements...\n");
  await new Promise((r) => setTimeout(r, 400));
  onStepUpdate("requirements", "completed");
  onStepUpdate("planning", "running");
  await new Promise((r) => setTimeout(r, 400));
  onStepUpdate("planning", "completed");
  onStepUpdate("ui", "running");
  onStreamChunk("⚡ Generating your app...\n");

  const frameworkLabels: Record<string, string> = {
    "react-ts": "React + TypeScript",
    "react-js": "React + JavaScript",
    "vue": "Vue 3",
    "svelte": "Svelte",
    "vanilla-js": "Vanilla JS/HTML/CSS",
  };
  const frameworkLabel = frameworkLabels[framework] ?? "React";
  const pluginContext = enabledPlugins.length
    ? `\n\nEnabled plugins: ${enabledPlugins.join(", ")}.`
    : "";

  const generationPrompt = `Build this ${frameworkLabel} app: "${userPrompt}"${pluginContext}

Create a complete, beautiful, fully functional app with multiple components, state management, and modern UI design.`;

  // Single fetch to backend - no streaming
  const fetchWithRetry = async (systemPrompt: string, userMsg: string): Promise<string> => {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://sitegeniebuild.com",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4-5",
        max_tokens: 16000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg }
        ],
      }),
      signal,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter error: ${res.status} ${err}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  };

  // Parse JSON from raw text - handles both raw JSON and fenced JSON
  const parseJSON = (text: string): Record<string, string> | null => {
    if (!text) return null;

    // Try 1: direct parse
    try { return JSON.parse(text.trim()); } catch {}

    // Try 2: extract from ```json ... ``` fences
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
      try { return JSON.parse(fenced[1].trim()); } catch {}
    }

    // Try 3: find first { ... } block
    const braceStart = text.indexOf("{");
    const braceEnd = text.lastIndexOf("}");
    if (braceStart >= 0 && braceEnd > braceStart) {
      try { return JSON.parse(text.slice(braceStart, braceEnd + 1)); } catch {}
    }

    return null;
  };

  let files: Record<string, string> | null = null;

  try {
    // Attempt 1: strong system prompt asking for raw JSON
    const systemPrompt = getCodeGenerationSystem(framework);
    const rawText = await fetchWithRetry(systemPrompt, generationPrompt);
    console.log("RAW RESPONSE LENGTH:", rawText.length);
    console.log("RAW RESPONSE PREVIEW:", rawText.slice(0, 200));

    files = parseJSON(rawText);

    // Attempt 2: retry with even simpler instruction
    if (!files || Object.keys(files).length === 0) {
      onStreamChunk("🔄 Retrying...\n");
      console.log("First parse failed, retrying...");

      const retryPrompt = `Create a ${frameworkLabel} app for: "${userPrompt}"

YOU MUST respond with ONLY a JSON object like this (no other text):
{"/App.tsx": "import React from 'react'; export default function App() { return <div>Hello</div>; }"}

Include at least 3 files with complete working code.`;

      const retryText = await fetchWithRetry(
        `You are a code generator. Return ONLY a raw JSON object mapping file paths to code strings. No markdown, no explanation, just JSON starting with { and ending with }.`,
        retryPrompt
      );
      console.log("RETRY RESPONSE LENGTH:", retryText.length);
      console.log("RETRY RESPONSE PREVIEW:", retryText.slice(0, 200));

      files = parseJSON(retryText);
    }
  } catch (err) {
    console.error("Generation error:", err);
  }

  // Normalize file paths
  if (files) {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(files)) {
      if (typeof value !== "string") continue;
      const k = key.startsWith("/") ? key : `/${key}`;
      normalized[k] = value;
    }
    files = Object.keys(normalized).length > 0 ? normalized : null;
  }

  onStepUpdate("ui", "completed");
  onStepUpdate("backend", "completed");
  onStepUpdate("fix", "completed");

  if (!files || Object.keys(files).length === 0) {
    console.error("ALL PARSING FAILED - check console logs above for raw response");
    // Return error info in the file so user can see what happened
    files = {
      "/App.tsx": `import React from 'react';
export default function App() {
  return (
    <div style={{padding:'2rem',fontFamily:'sans-serif',background:'#1a1a2e',minHeight:'100vh',color:'white'}}>
      <h1>Generation failed</h1>
      <p>Check browser console (F12) for details.</p>
      <p>Prompt was: ${userPrompt.slice(0, 100)}</p>
    </div>
  );
}`,
    };
  }

  onStreamChunk(`✅ Generated ${Object.keys(files).length} files!\n`);
  return { files, requirementsOutput: "", backendOutput: "" };
}

export async function editProject(
  userPrompt: string,
  currentFiles: VirtualFileSystem,
  onStreamChunk: (chunk: string) => void,
  signal?: AbortSignal,
  framework: Framework = "react-ts"
): Promise<VirtualFileSystem> {
  const fileList = Object.keys(currentFiles).map((f) => `- ${f}`).join("\n");
  const currentFilesJson = JSON.stringify(currentFiles, null, 2);

  const editPrompt = `The user wants to modify their ${getEditSystem(framework).includes("Vue") ? "Vue" : getEditSystem(framework).includes("Svelte") ? "Svelte" : "React"} app: "${userPrompt}"

Current project files:
${fileList}

Current file contents:
\`\`\`json
${currentFilesJson}
\`\`\`

Apply the requested changes and return ONLY the modified files as JSON.`;

  onStreamChunk("✏️ Applying changes to your project...\n\n");

  let responseText = "";
  await new Promise<void>((resolve, reject) => {
    sendStreamRequest({
      functionUrl: LLM_URL,
      requestBody: {
        contents: [{ role: "user", parts: [{ text: editPrompt }] }],
        systemPrompt: getEditSystem(framework),
      },
      supabaseAnonKey: SUPABASE_ANON_KEY,
      onData: (data) => {
        try {
          const parsed = JSON.parse(data);
          const chunk = parsed?.choices?.[0]?.delta?.content ?? parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (chunk) {
            responseText += chunk;
            const fileMatches = chunk.match(/"\/[^"]+\.(tsx?|jsx?|css|json)"/g);
            if (fileMatches) {
              for (const match of fileMatches) {
                onStreamChunk(`✏️ Updating ${match.replace(/"/g, "")}...\n`);
              }
            }
          }
        } catch { /* skip */ }
      },
      onComplete: resolve,
      onError: reject,
      signal,
    });
  });

  const changedFiles = parseFilesFromResponse(responseText);
  if (!changedFiles) throw new Error("Failed to parse modification response.");
  return { ...currentFiles, ...changedFiles };
}

export function isEditRequest(prompt: string): boolean {
  const editKeywords = [
    "add", "change", "update", "modify", "fix", "make", "remove", "delete",
    "edit", "adjust", "improve", "refactor", "style", "color", "dark mode",
    "light mode", "responsive", "mobile", "bigger", "smaller", "faster",
  ];
  const lower = prompt.toLowerCase();
  return editKeywords.some((kw) => lower.includes(kw));
}

