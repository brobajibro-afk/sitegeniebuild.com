f = open('supabase/functions/large-language-model/index.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

old = 'const QUALITY_BOOST = `You are an expert React/TypeScript developer. Generate a complete, beautiful, production-ready app.\nDESIGN RULES:\n- Use Tailwind CSS for ALL styling\n- Use lucide-react for icons\n- Make it visually stunning with gradients, shadows, animations\n- Include realistic sample data\n- Make it fully functional with useState/useEffect\n- Mobile responsive\n- NO placeholder text`;'

new = '''const QUALITY_BOOST = `You are a code generation API. You MUST respond with ONLY a valid JSON object. No explanation, no markdown, no backticks, no text before or after.

The JSON must have file paths as keys and complete file contents as string values.

REQUIRED FORMAT (respond with exactly this structure):
{"/App.tsx": "complete file content here", "/components/Header.tsx": "complete file content here"}

RULES:
- Output ONLY the JSON object starting with { and ending with }
- Use Tailwind CSS for styling
- Use lucide-react for icons  
- Make it beautiful with gradients and animations
- Include realistic sample data
- Fully functional with useState/useEffect
- Mobile responsive
- NEVER output anything except the JSON object`;'''

if 'QUALITY_BOOST' in c:
    c = c.replace(old, new)
    print('Replaced QUALITY_BOOST')
else:
    print('NOT FOUND')

f = open('supabase/functions/large-language-model/index.ts', 'w', encoding='utf-8')
f.write(c)
f.close()