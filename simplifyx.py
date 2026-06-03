f = open('src/lib/ai-agents.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

# Find where we try to save to database
old = '''let files = parseFilesFromResponse(generatedText);
  // Retry: ask LLM to re-emit'''

new = '''console.log("PARSED FILES:", Object.keys(files || {}).length);
  let files = parseFilesFromResponse(generatedText);
  if (files && Object.keys(files).length > 0) {
    onStreamChunk("✅ Files generated! Displaying...");
    return files;
  }
  // Retry: ask LLM to re-emit'''

if old in c:
    c = c.replace(old, new)
    print('Fixed!')
else:
    print('NOT FOUND')

f = open('src/lib/ai-agents.ts', 'w', encoding='utf-8')
f.write(c)
f.close()