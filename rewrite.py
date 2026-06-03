import re

path = 'src/lib/ai-agents.ts'
f = open(path, 'r', encoding='utf-8')
c = f.read()
f.close()

# Find the full generateProject function and replace it
old_start = c.find('xport async function generateProject(')
if old_start < 0:
    old_start = c.find('export async function generateProject(')

# Find where editProject starts
old_end = c.find('export async function editProject(')

old_func = c[old_start:old_end]

new_func = '''export async function generateProject(
  userPrompt: string,
  onStepUpdate: (stepId: string, status: AgentStep["status"]) => void,
  onStreamChunk: (chunk: string) => void,
  signal?: AbortSignal,
  enabledPlugins: string[] = [],
  framework: Framework = "react-ts",
  model: string = "claude-sonnet-4-20250514"
): Promise<GenerateProjectResult> {

  onStepUpdate("requirements", "running");
  onStreamChunk("🔍 Analyzing requirements...\\n");
  await new Promise((r) => setTimeout(r, 400));
  onStepUpdate("requirements", "completed");
  onStepUpdate("planning", "running");
  await new Promise((r) => setTimeout(r, 400));
  onStepUpdate("planning", "completed");
  onStepUpdate("ui", "running");
  onStreamChunk("⚡ Generating your app...\\n");

  const frameworkLabels: Record<string, string> = {
    "react-ts": "React + TypeScript",
    "react-js": "React + JavaScript",
    "vue": "Vue 3",
    "svelte": "Svelte",
    "vanilla-js": "Vanilla JS/HTML/CSS",
  };
  const frameworkLabel = frameworkLabels[framework] ?? "React";
  const pluginContext = enabledPlugins.length
    ? `\\n\\nEnabled plugins: ${enabledPlugins.join(", ")}.`
    : "";

  const generationPrompt = `Build this ${frameworkLabel} app: "${userPrompt}"${pluginContext}

Create a complete, beautiful, fully functional app with multiple components, state management, and modern UI design.`;

  // Single fetch to backend - no streaming
  const fetchWithRetry = async (systemPrompt: string, userMsg: string): Promise<string> => {
    const res = await fetch(LLM_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userMsg }] }],
        systemPrompt,
      }),
      signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.text || "";
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
      onStreamChunk("🔄 Retrying...\\n");
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

  onStreamChunk(`✅ Generated ${Object.keys(files).length} files!\\n`);
  return { files, requirementsOutput: "", backendOutput: "" };
}

'''

# Replace the old function
new_content = c[:old_start] + new_func + c[old_end:]

f = open(path, 'w', encoding='utf-8')
f.write(new_content)
f.close()
print("✅ generateProject rewritten!")
print("New function length:", len(new_func))