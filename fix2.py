f = open('supabase/functions/large-language-model/index.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

c = c.replace(
    'console.log("Using model:", model);',
    'console.log("Using model:", model);\n  console.log("API key exists:", !!apiKey);\n  console.log("Messages count:", messages.length);'
)

f = open('supabase/functions/large-language-model/index.ts', 'w', encoding='utf-8')
f.write(c)
f.close()
print('Done')