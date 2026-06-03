f = open('supabase/functions/large-language-model/index.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

old = '''const data = await upstream.json();
  const text = data.choices[0]?.message?.content || '';
  return new Response(JSON.stringify({ text }),'''

new = '''const data = await upstream.json();
  console.log("Response data:", JSON.stringify(data).slice(0, 200));
  const text = data.choices[0]?.message?.content || '';
  console.log("Extracted text length:", text.length);
  return new Response(JSON.stringify({ text }),'''

if old in c:
    c = c.replace(old, new)
    print('Fixed!')
else:
    print('NOT FOUND')

f = open('supabase/functions/large-language-model/index.ts', 'w', encoding='utf-8')
f.write(c)
f.close()