f = open('src/lib/ai-agents.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

# Fix the broken chunk parsing
old = """const chunk = parsed?.choices?.[0]?.delta?.content ?? parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (chunk) fullText += chunk;
          continue;"""
new = 'const chunk = parsed?.choices?.[0]?.delta?.content ?? parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";'
c = c.replace(old, new)

f = open('src/lib/ai-agents.ts', 'w', encoding='utf-8')
f.write(c)
f.close()
print('Done')