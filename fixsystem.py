f = open('supabase/functions/large-language-model/index.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

old = '''QUALITY_BOOST = `You are a code generation API. You MUST respond with ONLY a valid JSON object. No explanation, no markdown, no backticks, no text before or after.
The JSON must have file paths as keys and complete file contents as string values.
REQUIRED FORMAT (respond with exactly this structure):
{"/App.tsx": "complete file content here", "/components/Header.tsx": "complete file content here"}
RULES:
- Output ONLY the JSON object starting with { and ending with }
- Use Tailwind CSS for st'''

# Find full QUALITY_BOOST and replace
start = c.find('QUALITY_BOOST = `')
end = c.find('`;\n', start) + 3
print("Found QUALITY_BOOST:", start, "to", end)
print("Current value:", c[start:end][:200])

new_boost = 'QUALITY_BOOST = `Return ONLY a raw JSON object. No markdown, no backticks, no explanation. Start with { and end with }.`;'

c = c[:start] + new_boost + c[end:]
f = open('supabase/functions/large-language-model/index.ts', 'w', encoding='utf-8')
f.write(c)
f.close()
print("✅ Fixed!")