f = open('src/lib/ai-agents.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

old = "const chunk = parsed?.choices?.[0]?.delta?.content ?? parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? \"\";"
new = """const chunk = parsed?.choices?.[0]?.delta?.content ?? parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (chunk) fullText += chunk;
          continue;"""

c = c.replace(old, new)

# Make parser much more aggressive
old2 = '''export function parseFilesFromResponse(responseText: string): VirtualFileSystem | null {
  if (!responseText) return null;
  // Strategy 1: every fenced code block (```json / ```tsx / ``` etc.)
  const codeBlockRe = /```(?:json|javascript|typescript|jsx|tsx)?\\s*([\\s\\S]*?)```/g;'''

new2 = '''export function parseFilesFromResponse(responseText: string): VirtualFileSystem | null {
  if (!responseText) return null;
  console.log("PARSING RESPONSE LENGTH:", responseText.length, "FIRST 200:", responseText.slice(0, 200));
  // Strategy 1: every fenced code block (```json / ```tsx / ``` etc.)
  const codeBlockRe = /```(?:json|javascript|typescript|jsx|tsx)?\\s*([\\s\\S]*?)```/g;'''

c = c.replace(old2, new2)

f = open('src/lib/ai-agents.ts', 'w', encoding='utf-8')
f.write(c)
f.close()
print('Done')