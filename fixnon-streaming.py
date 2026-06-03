f = open('supabase/functions/large-language-model/index.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

# Remove stream: true
c = c.replace('stream: true,', 'stream: false,')

# Return text directly, not streaming body
old = 'return new Response(upstream.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });'
new = '''const data = await upstream.json();
  const text = data.choices[0]?.message?.content || '';
  return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });'''

c = c.replace(old, new)

f = open('supabase/functions/large-language-model/index.ts', 'w', encoding='utf-8')
f.write(c)
f.close()
print('Done')