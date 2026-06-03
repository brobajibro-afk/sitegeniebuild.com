f = open('src/lib/ai-agents.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

old = '''let generatedText = "";
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
          if (chunk) {
            generatedText += chunk;
            const fileMatches = chunk.match(/"\/[^"]+\.(tsx?|jsx?|css|json)"/g);
            if (fileMatches) {
              for (const match of fileMatches) {
                onStreamChunk(`📄 Creating ${match.replace(/"/g, "")}...\\n`);
              }
            }
          }
        } catch { /* skip */ }
      },
      onComplete: resolve,
      onError: reject,
      signal,
    });
  });'''

new = '''let generatedText = "";
  const res = await fetch(LLM_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: generationPrompt }] }],
      systemPrompt: getCodeGenerationSystem(framework),
    }),
    signal,
  });
  const data = await res.json();
  if (data.files && Object.keys(data.files).length > 0) {
    generatedText = JSON.stringify(data.files);
    onStreamChunk(`✅ Generated ${Object.keys(data.files).length} files!\\n`);
  } else if (data.text) {
    generatedText = data.text;
  }'''

if old in c:
    c = c.replace(old, new)
    print('✅ FIXED!')
else:
    print('❌ NOT FOUND')

f = open('src/lib/ai-agents.ts', 'w', encoding='utf-8')
f.write(c)
f.close()