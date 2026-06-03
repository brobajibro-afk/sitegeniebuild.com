f = open('src/lib/ai-agents.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

old = '''let fullText = "";
    sendStreamRequest({
      functionUrl: LLM_URL,
      requestBody: { contents, systemPrompt, model },
      supabaseAnonKey: SUPABASE_ANON_KEY,
      onData: (data) => {
        try {
          let cleanData = data;
          if (cleanData.startsWith('data: ')) cleanData = cleanData.slice(6);
          const parsed = JSON.parse(cleanData);
          const chunk = parsed?.choices?.[0]?.delta?.content ?? parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          fullText += chunk;
        } catch { /* skip */ }
      },
      onComplete: () => resolve(fullText),
      onError: reject,
      signal,
    });'''

new = '''const res = await fetch(LLM_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contents, systemPrompt, model }),
      signal,
    });
    const data = await res.json();
    const fullText = data.text || '';
    resolve(fullText);'''

if old in c:
    c = c.replace(old, new)
    print('Fixed!')
else:
    print('NOT FOUND')

f = open('src/lib/ai-agents.ts', 'w', encoding='utf-8')
f.write(c)
f.close()