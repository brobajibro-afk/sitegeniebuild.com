f = open('supabase/functions/large-language-model/index.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

c = c.replace(
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'https://openrouter.ai/api/v1/chat/completions'
)
c = c.replace(
    'DEFAULT_MODEL = "gemini-2.0-flash"',
    'DEFAULT_MODEL = "anthropic/claude-sonnet-4-5"'
)
c = c.replace('max_tokens: 8000', 'max_tokens: 16000')

f = open('supabase/functions/large-language-model/index.ts', 'w', encoding='utf-8')
f.write(c)
f.close()
print('Done')