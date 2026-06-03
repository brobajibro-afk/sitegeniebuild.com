f = open('src/lib/ai-agents.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

old = '''onData: (data) => {
        try {
          const parsed = JSON.parse(data);
          const chunk = parsed?.choices?.[0]?.delta?.content ?? parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          fullText += chunk;
        } catch { /* skip */ }
      },'''

new = '''onData: (data) => {
        try {
          let cleanData = data;
          if (cleanData.startsWith('data: ')) cleanData = cleanData.slice(6);
          const parsed = JSON.parse(cleanData);
          const chunk = parsed?.choices?.[0]?.delta?.content ?? parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          fullText += chunk;
        } catch { /* skip */ }
      },'''

if old in c:
    c = c.replace(old, new)
    print('Fixed!')
else:
    print('NOT FOUND')

f = open('src/lib/ai-agents.ts', 'w', encoding='utf-8')
f.write(c)
f.close()