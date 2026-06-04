f = open('src/lib/ai-agents.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

# Find and replace hardcoded key with env var
old = 'apiKey: "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",'
new = 'apiKey: import.meta.env.VITE_OPENROUTER_KEY,'

if old in c:
    c = c.replace(old, new)
    print("✅ Fixed!")
else:
    # Find whatever key is there
    idx = c.find('apiKey:')
    print("NOT FOUND. Current apiKey line:")
    print(c[idx:idx+100])

f = open('src/lib/ai-agents.ts', 'w', encoding='utf-8')
f.write(c)
f.close()