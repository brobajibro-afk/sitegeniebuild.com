f = open('src/lib/ai-agents.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

old = 'export function parseFilesFromResponse(responseText: string): VirtualFileSystem | null {\n  if (!responseText) return null;\n  console.log("PARSING RESPONSE LENGTH:", responseText.length, "FIRST 200:", responseText.slice(0, 200));\n  // Strategy 1: every fenced code block (```json / ```tsx / ``` etc.)\n  const codeBlockRe = /```(?:json|javascript|typescript|jsx|tsx)?\\s*([\\s\\S]*?)```/g;'

new = 'export function parseFilesFromResponse(responseText: string): VirtualFileSystem | null {\n  if (!responseText) return null;\n  // Strip markdown code fences first\n  let cleaned = responseText.trim();\n  const fenceMatch = cleaned.match(/```(?:json)?\\s*([\\s\\S]*?)```/);\n  if (fenceMatch) cleaned = fenceMatch[1].trim();\n  // Try direct parse on cleaned text first\n  if (cleaned.startsWith("{")) {\n    try {\n      const parsed = JSON.parse(cleaned);\n      const files = extractFilesFromObject(parsed);\n      if (files) return files;\n    } catch { /* continue */ }\n  }\n  // Strategy 1: every fenced code block\n  const codeBlockRe = /```(?:json|javascript|typescript|jsx|tsx)?\\s*([\\s\\S]*?)```/g;'

if old in c:
    c = c.replace(old, new)
    print('Fixed parser')
else:
    print('Pattern not found - trying alternative')
    idx = c.find('export function parseFilesFromResponse')
    print(c[idx:idx+300])

f = open('src/lib/ai-agents.ts', 'w', encoding='utf-8')
f.write(c)
f.close()