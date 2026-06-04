f = open('src/lib/ai-agents.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

# Find fetchWithRetry and replace entirely
start = c.find('fetchWithRetry = async (systemPrompt: string, userMsg: string): Promise<string> => {')
# Find the closing }; of this function
end = c.find('};', start) + 2

print("Found at:", start, "to", end)
print("Current:", c[start:start+200])

new_fetch = '''fetchWithRetry = async (systemPrompt: string, userMsg: string): Promise<string> => {
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
  };'''

c = c[:start] + new_fetch + c[end:]

f = open('src/lib/ai-agents.ts', 'w', encoding='utf-8')
f.write(c)
f.close()
print("✅ Done!")