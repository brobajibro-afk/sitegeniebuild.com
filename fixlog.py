f = open('src/lib/ai-agents.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

old = "let files = parseFilesFromResponse(generatedText);"
new = """console.log('GENERATED TEXT LENGTH:', generatedText.length);
  console.log('GENERATED TEXT SAMPLE:', generatedText.slice(0, 300));
  let files = parseFilesFromResponse(generatedText);"""

c = c.replace(old, new)

f = open('src/lib/ai-agents.ts', 'w', encoding='utf-8')
f.write(c)
f.close()
print('Done')