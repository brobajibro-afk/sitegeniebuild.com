f = open('src/lib/ai-agents.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

old = 'parseFilesFromResponse(responseText: string): VirtualFileSystem | null {\n  if (!responseText) return null;\n\n  // Strategy 1: every fenced code block (```json / ```tsx / ``` etc.)\n  const codeBlockRe = /```(?:json|javascript|typescript|jsx|tsx)?\\s*([\\s\\S]*?)```/g;\n  let match: RegExpExecArray | null;'

new = 'parseFilesFromResponse(responseText: string): VirtualFileSystem | null {\n  if (!responseText) return null;\n\n  // Strip markdown fences - Claude wraps in ```json\n  const fenceMatch = responseText.match(/```(?:json)?\\s*([\\s\\S]*?)```/);\n  const cleaned = fenceMatch ? fenceMatch[1].trim() : responseText.trim();\n  if (cleaned.startsWith("{")) {\n    try {\n      const direct = JSON.parse(cleaned);\n      const directFiles = extractFilesFromObject(direct);\n      if (directFiles) return directFiles;\n    } catch { /* continue */ }\n  }\n\n  // Strategy 1: every fenced code block\n  const codeBlockRe = /```(?:json|javascript|typescript|jsx|tsx)?\\s*([\\s\\S]*?)```/g;\n  let match: RegExpExecArray | null;'

if old in c:
    c = c.replace(old, new)
    print('Fixed!')
else:
    print('NOT FOUND')

f = open('src/lib/ai-agents.ts', 'w', encoding='utf-8')
f.write(c)
f.close()