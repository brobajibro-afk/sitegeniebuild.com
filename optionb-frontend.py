f = open('src/lib/ai-agents.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

old = '''const data = await res.json();
    const fullText = data.text || '';
    resolve(fullText);'''

new = '''const data = await res.json();
    if (data.files && Object.keys(data.files).length > 0) {
      console.log("✅ Files received from edge:", Object.keys(data.files).length);
      resolve(JSON.stringify(data.files));
    } else if (data.text) {
      resolve(data.text);
    } else {
      resolve('');
    }'''

if old in c:
    c = c.replace(old, new)
    print('✅ Fixed!')
else:
    print('❌ NOT FOUND')

f = open('src/lib/ai-agents.ts', 'w', encoding='utf-8')
f.write(c)
f.close()