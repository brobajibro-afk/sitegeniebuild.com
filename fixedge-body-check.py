f = open('supabase/functions/large-language-model/index.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

old = '''if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text();
    console.error("Upstream error:", upstream.status, errText);'''

new = '''if (!upstream.ok) {
    const errText = await upstream.text();
    console.error("Upstream error:", upstream.status, errText);'''

if old in c:
    c = c.replace(old, new)
    print('Fixed!')
else:
    print('NOT FOUND')

f = open('supabase/functions/large-language-model/index.ts', 'w', encoding='utf-8')
f.write(c)
f.close()