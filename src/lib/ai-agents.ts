import { sendStreamRequest } from "@/lib/sse";
import type { AgentStep, Framework, VirtualFileSystem } from "@/types/types";
import { getCodeGenerationSystem, getEditSystem } from "@/lib/frameworks";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const LLM_URL = `${SUPABASE_URL}/functions/v1/large-language-model`;

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
    let fullText = "";
    sendStreamRequest({
      functionUrl: LLM_URL,
      requestBody: { contents, systemPrompt, model },
      supabaseAnonKey: SUPABASE_ANON_KEY,
      onData: (data) => {
        try {
          const parsed = JSON.parse(data);
          const chunk = parsed?.choices?.[0]?.delta?.content ?? parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (chunk) fullText += chunk;
          continue;
          fullText += chunk;
        } catch { /* skip */ }
      },
      onComplete: () => resolve(fullText),
      onError: reject,
      signal,
    });
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

  // Strategy 1: every fenced code block (```json / ```tsx / ``` etc.)
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

export async function generateProject(
  userPrompt: string,
  onStepUpdate: (stepId: string, status: AgentStep["status"]) => void,
  onStreamChunk: (chunk: string) => void,
  signal?: AbortSignal,
  enabledPlugins: string[] = [],
  framework: Framework = "react-ts",
  model: string = "claude-sonnet-4-20250514"
): Promise<GenerateProjectResult> {
  // Step 1: Requirements
  onStepUpdate("requirements", "running");
  const reqPrompt = `Analyze this app request and list the key components, features, and requirements needed: "${userPrompt}". Format as bullet points with sections: Core Features, Components, Data/State, UI/UX.`;
  const requirementsOutput = await collectStreamText(
    [{ role: "user", parts: [{ text: reqPrompt }] }],
    "You are a technical requirements analyst. Be concise and structured.",
    signal
  );
  onStepUpdate("requirements", "completed");
  onStreamChunk(`📋 **Requirements analyzed**\n\n${requirementsOutput.slice(0, 300)}...\n\n`);

  // Step 2: Planning
  onStepUpdate("planning", "running");
  await new Promise((r) => setTimeout(r, 300));
  onStepUpdate("planning", "completed");

  // Step 3: UI Generation
  onStepUpdate("ui", "running");

  const pluginContext = enabledPlugins.length
    ? `\n\nEnabled plugins: ${enabledPlugins.join(", ")}. Incorporate these technologies where appropriate.`
    : "";

  const frameworkLabels: Record<string, string> = {
    "react-ts": "React + TypeScript",
    "react-js": "React + JavaScript",
    "vue": "Vue 3",
    "svelte": "Svelte",
    "vanilla-js": "Vanilla JS/HTML/CSS",
    "python-django": "Python Django",
    "php-laravel": "PHP Laravel",
  };
  const frameworkLabel = frameworkLabels[framework] ?? "React";

  const generationPrompt = `Build this ${frameworkLabel} application: "${userPrompt}"${pluginContext}

Generate a complete, beautiful ${frameworkLabel} app with:
- Modern, professional design
- Multiple components / files
- Interactive features and state management
- Responsive layout
- Rich visual design with gradients and animations

Return ONLY valid JSON in a code block with all file contents.`;

  onStreamChunk("🎨 Generating UI components...\n\n");

  let generatedText = "";
  await new Promise<void>((resolve, reject) => {
    sendStreamRequest({
      functionUrl: LLM_URL,
      requestBody: {
        contents: [{ role: "user", parts: [{ text: generationPrompt }] }],
        systemPrompt: getCodeGenerationSystem(framework),
      },
      supabaseAnonKey: SUPABASE_ANON_KEY,
      onData: (data) => {
        try {
          const parsed = JSON.parse(data);
          const chunk = parsed?.choices?.[0]?.delta?.content ?? parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (chunk) fullText += chunk;
          continue;
          if (chunk) {
            generatedText += chunk;
            const fileMatches = chunk.match(/"\/[^"]+\.(tsx?|jsx?|css|json)"/g);
            if (fileMatches) {
              for (const match of fileMatches) {
                onStreamChunk(`📄 Creating ${match.replace(/"/g, "")}...\n`);
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

  onStepUpdate("ui", "completed");

  // Step 4: Backend
  onStepUpdate("backend", "running");
  const backendPrompt = `For the app: "${userPrompt}", describe the backend/database schema needed. List: tables, columns, relationships, and any API endpoints. Format as structured SQL + REST API spec.`;
  const backendOutput = await collectStreamText(
    [{ role: "user", parts: [{ text: backendPrompt }] }],
    "You are a backend architect. Provide a concise database schema and API spec.",
    signal
  );
  onStepUpdate("backend", "completed");
  onStreamChunk(`\n⚙️ **Backend schema generated**\n\n${backendOutput.slice(0, 200)}...\n\n`);

  // Step 5: Fix — parse files, retry once if needed
  onStepUpdate("fix", "running");
  console.log("RAW RESPONSE:", generatedText.slice(0,500));
  let files = parseFilesFromResponse(generatedText);

  // Retry: ask LLM to re-emit just the JSON if first parse failed
  if (!files || Object.keys(files).length === 0) {
    onStreamChunk("🔄 Retrying file extraction...\n");
    try {
      const retryText = await collectStreamText(
        [
          { role: "user", parts: [{ text: generationPrompt }] },
          { role: "assistant", parts: [{ text: generatedText }] },
          {
            role: "user",
            parts: [{
              text: 'Your previous response was not valid JSON. Output ONLY the JSON code block — no other text:\n```json\n{ "/App.tsx": "..." }\n```',
            }],
          },
        ],
        getCodeGenerationSystem(framework),
        signal
      );
      files = parseFilesFromResponse(retryText);
      if (!files || Object.keys(files).length === 0) {
        // Last resort: synthesize a minimal App.tsx from the prompt
        files = {
          "/App.tsx": `import React from 'react';\n\nexport default function App() {\n  return (\n    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#1a1a2e',color:'white',fontFamily:'sans-serif'}}>\n      <div style={{textAlign:'center'}}>\n        <h1 style={{fontSize:'2rem',marginBottom:'1rem'}}>🚀 ${userPrompt.slice(0, 60)}</h1>\n        <p style={{color:'#aaa'}}>Generated with SiteGenie — edit me!</p>\n      </div>\n    </div>\n  );\n}`,
        };
      }
    } catch {
      files = {
        "/App.tsx": `import React from 'react';\n\nexport default function App() {\n  return <div style={{padding:'2rem',fontFamily:'sans-serif'}}><h1>${userPrompt.slice(0,60)}</h1></div>;\n}`,
      };
    }
  }
  onStepUpdate("fix", "completed");

  return { files, requirementsOutput, backendOutput };
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
          if (chunk) fullText += chunk;
          continue;
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

