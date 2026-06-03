f = open('src/lib/frameworks.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

old = '''  const base = `OUTPUT FORMAT — STRICTLY REQUIRED:
Your ENTIRE response must be ONE fenced code block containing valid JSON:
\`\`\`json
{
  "/path/to/file": "complete file content here"
}
\`\`\`
NEVER output anything outside the code block. NO explanations, NO markdown text, NO comments.
JSON keys = file paths starting with "/". Values = complete file contents as strings.
Use \\\\n for newlines, escape double quotes as \\\\" inside string values.`;'''

new = '''  const base = `OUTPUT FORMAT — STRICTLY REQUIRED:
Return ONLY a raw JSON object. No markdown fences, no backticks, no explanation.
Start your response with { and end with }.
JSON keys = file paths starting with "/". Values = complete file contents as strings.
Use \\\\n for newlines, escape double quotes as \\\\" inside string values.`;'''

if old in c:
    c = c.replace(old, new)
    print("✅ Fixed frameworks.ts!")
else:
    print("❌ Not found")

f = open('src/lib/frameworks.ts', 'w', encoding='utf-8')
f.write(c)
f.close()