f = open('supabase/functions/large-language-model/index.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

# Find the entire response return section and replace with simple passthrough
old = '''const data = await upstream.json();
  const text = data.choices[0]?.message?.content || '';
  console.log("RAW TEXT LENGTH:", text.length, "FIRST 100:", text.slice(0, 100));
  
  // Extract JSON from markdown fences
  let jsonText = text.trim();
  const fenceMatch = text.match(/```(?:json)?\\s*([\\s\\S]*?)```/);
  if (fenceMatch) {
    jsonText = fenceMatch[1].trim();
    console.log("EXTRACTED FROM FENCE:", jsonText.slice(0, 100));
  }
  
  let files = {};
  if (jsonText.startsWith("{")) {
    try {
      files = JSON.parse(jsonText);
      console.log("✅ PARSED FILES:", Object.keys(files).length, "files");
    } catch (e) {
      console.error("❌ PARSE ERROR:", e.message, "TEXT:", jsonText.slice(0, 200));
    }
  } else {
    console.error("NOT JSON:", jsonText.slice(0, 100));
  }
  
  return new Response(JSON.stringify({ files }),'''

new = '''const data = await upstream.json();
  const text = data.choices[0]?.message?.content || '';
  return new Response(JSON.stringify({ text }),'''

if old in c:
    c = c.replace(old, new)
    print('✅ SIMPLIFIED EDGE FUNCTION')
else:
    print('Pattern not found - edge function already simple')

f = open('supabase/functions/large-language-model/index.ts', 'w', encoding='utf-8')
f.write(c)
f.close()