f=open('src/lib/frameworks.ts','r',encoding='utf-8')
c=f.read()
f.close()

c=c.replace(
  '1. Pure React + TypeScript only — no external libraries. Use inline styles (no Tailwind).',
  '1. Use Tailwind CSS for ALL styling. Use lucide-react for icons. Make it visually stunning.'
)
c=c.replace(
  '1. Pure React with JavaScript (.jsx files) — no TypeScript, no external libs. Inline styles only.',
  '1. Use Tailwind CSS for ALL styling. Use lucide-react for icons. Make it visually stunning.'
)

f=open('src/lib/frameworks.ts','w',encoding='utf-8')
f.write(c)
f.close()
print('Done frameworks')