f = open('src/lib/ai-agents.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

# Add imports at the top
old = "import { getCodeGenerationSystem, getEditSystem } from \"@/lib/frameworks\";"
new = """import { getCodeGenerationSystem, getEditSystem } from "@/lib/frameworks";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: "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",
});"""

if old in c:
    c = c.replace(old, new)
    print("✅ Added imports")
else:
    print("❌ Import line not found")

# Replace the fetchWithRetry function
old2 = '''  // Call OpenRouter directly
  const fetchWithRetry = async (systemPrompt: string, userMsg: string): Promise<string> => {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",
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
  };'''

new2 = '''  // Call OpenRouter via Vercel AI SDK
  const fetchWithRetry = async (systemPrompt: string, userMsg: string): Promise<string> => {
    const { text } = await generateText({
      model: openrouter("anthropic/claude-sonnet-4-5"),
      system: systemPrompt,
      prompt: userMsg,
      maxTokens: 16000,
    });
    return text || "";
  };'''

if old2 in c:
    c = c.replace(old2, new2)
    print("✅ Replaced fetch with Vercel AI SDK")
else:
    print("❌ fetchWithRetry not found - checking...")
    idx = c.find("fetchWithRetry")
    print(c[max(0,idx-50):idx+200])

f = open('src/lib/ai-agents.ts', 'w', encoding='utf-8')
f.write(c)
f.close()