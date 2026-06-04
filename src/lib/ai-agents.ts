python << 'EOF'
with open('src/lib/ai-agents.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: typo eexport -> export
content = content.replace('eexport async function generateProject', 'export async function generateProject')

# Fix 2: Replace the entire generateProject to use Railway WebSocket
old_generate = '''export async function generateProject(
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
  onStreamChunk("⚡ Generating your app...\\n");'''

new_generate = '''export async function generateProject(
  userPrompt: string,
  onStepUpdate: (stepId: string, status: AgentStep["status"]) => void,
  onStreamChunk: (chunk: string) => void,
  signal?: AbortSignal,
  enabledPlugins: string[] = [],
  framework: Framework = "react-ts",
  model: string = "claude-sonnet-4-20250514"
): Promise<GenerateProjectResult> {

  return new Promise((resolve, reject) => {
    const ws = new WebSocket("wss://web-production-27b64.up.railway.app/ws/generate");
    let files: VirtualFileSystem | null = null;

    ws.onopen = () => {
      onStepUpdate("requirements", "running");
      onStreamChunk("🔍 Connecting to CrewAI agents...\\n");
      ws.send(JSON.stringify({ prompt: userPrompt }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.agent === "planner") {
          onStepUpdate("requirements", "running");
          onStreamChunk(`📋 ${data.status}\\n`);
        } else if (data.agent === "frontend") {
          onStepUpdate("ui", "running");
          onStreamChunk(`⚛️  ${data.status}\\n`);
        } else if (data.agent === "fixer") {
          onStepUpdate("fix", "running");
          onStreamChunk(`🔧 ${data.status}\\n`);
        } else if (data.agent === "complete") {
          if (data.files) {
            files = data.files;
          } else if (data.result) {
            const parsed = parseFilesFromResponse(data.result);
            if (parsed) files = parsed;
          }
          onStepUpdate("requirements", "completed");
          onStepUpdate("planning", "completed");
          onStepUpdate("ui", "completed");
          onStepUpdate("backend", "completed");
          onStepUpdate("fix", "completed");
          onStreamChunk(`✅ Generation complete!\\n`);
        }
      } catch (e) {
        console.error("Message parse error:", e);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      onStreamChunk("❌ Connection error - falling back to placeholder\\n");
      files = {
        "/App.tsx": `import React from 'react';
export default function App() {
  return <div style={{padding: '2rem'}}><h1>${userPrompt}</h1><p>Generated with SiteGenie</p></div>;
}`
      };
    };

    ws.onclose = () => {
      if (!files) {
        files = {
          "/App.tsx": `import React from 'react';
export default function App() {
  return <div style={{padding: '2rem'}}><h1>${userPrompt}</h1><p>Generated with SiteGenie</p></div>;
}`
        };
      }
      resolve({ files: files || {}, requirementsOutput: "", backendOutput: "" });
    };
  });
}

async function oldGenerateProject_deprecated(
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
  onStreamChunk("⚡ Generating your app...\\n");'''

content = content.replace(old_generate, new_generate)

with open('src/lib/ai-agents.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed generateProject to use Railway WebSocket")
EOF