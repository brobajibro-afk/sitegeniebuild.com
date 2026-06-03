f = open('src/lib/ai-agents.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

old = '''export function parseFilesFromResponse(responseText: string): VirtualFileSystem | null {
  if (!responseText) return null;
  // Strategy 1: every fenced code block (```json / ```tsx / ``` etc.)
  const codeBlockRe = /```(?:json|javascript|typescript|jsx|tsx)?\\s*([\\s\\S]*?)```/g;'''

new = '''export function parseFilesFromResponse(responseText: string): VirtualFileSystem | null {
  if (!responseText) return null;
  // Strip markdown fences first - Claude always wraps in ```json
  const fenceMatch = responseText.match(/```(?:json)?\\s*([\\s\\S]*?)```/);
  const cleaned = fenceMatch ? fenceMatch[1].trim() : responseText.trim();
  if (cleaned.startsWith("{")) {
    try {
      const direct = JSON.parse(cleaned);
      const directFiles = extractFilesFromObject(direct);
      if (directFiles) return directFiles;
    } catch { /* continue */ }
  }
  // Strategy 1: every fenced code block
  const codeBlockRe = /```(?:json|javascript|typescript|jsx|tsx)?\\s*([\\s\\S]*?)```/g;'''

if old in c:
    c = c.replace(old, new)
    print('Fixed!')
else:
    print('NOT FOUND')
    idx = c.find('parseFilesFromResponse')
    print(c[idx:idx+200])

f = open('src/lib/ai-agents.ts', 'w', encoding='utf-8')
f.write(c)
f.close()